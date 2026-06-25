"""
Phase 2 (embeddings sub-step) — semantic_fit + twin detection.
- Encodes JD intent + candidate profile/career text with a CPU sentence-transformer.
- Computes semantic_fit, merges into candidate_features.parquet.
- Saves reusable vectors (.npy) so the ranking step stays offline.
- keyword vs semantic vs hybrid comparison + twin/duplicate detection.
Usage: python build_embeddings.py [--candidates PATH] [--limit N]
"""
import argparse, io, json, os, sys, time, hashlib
from pathlib import Path
import numpy as np, pandas as pd
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.jd_intent import JD_INTENT, JD_EXEMPLARS

_HERE    = Path(__file__).resolve().parent
DEF_CAND = os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent / "data" / "candidates.jsonl"))
ART      = Path(os.environ.get("ARTIFACTS_DIR", str(_HERE / "artifacts")))
MODEL    = "sentence-transformers/all-MiniLM-L6-v2"

def load_texts(path, limit=0):
    ids, headline, summary, career, skillsig, caresig = [], [], [], [], [], []
    with io.open(path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            if not line.strip(): continue
            r = json.loads(line); p = r.get("profile", {}) or {}; ch = r.get("career_history", []) or []
            ids.append(r["candidate_id"])
            headline.append(p.get("headline", "") or "")
            summary.append(p.get("summary", "") or "")
            cdesc = " ".join((j.get("description", "") or "") for j in ch)
            career.append(cdesc)
            sk = tuple(sorted((s.get("name", "") or "") for s in r.get("skills", []) or []))
            skillsig.append(sk)
            caresig.append(tuple((j.get("title",""), j.get("company",""), j.get("duration_months")) for j in ch))
            if limit and len(ids) >= limit: break
    return ids, headline, summary, career, skillsig, caresig

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", default=DEF_CAND)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    print("[emb] loading candidate texts ...")
    t0 = time.time()
    ids, headline, summary, career, skillsig, caresig = load_texts(args.candidates, args.limit)
    print(f"  {len(ids):,} candidates, {time.time()-t0:.1f}s")

    from sentence_transformers import SentenceTransformer
    import torch
    torch.set_num_threads(os.cpu_count())
    model = SentenceTransformer(MODEL, device="cpu")

    # JD query vector = normalized mean of intent doc + exemplars
    jd_mat = model.encode([JD_INTENT] + JD_EXEMPLARS, normalize_embeddings=True,
                          batch_size=16, convert_to_numpy=True)
    jd_vec = jd_mat.mean(0); jd_vec /= np.linalg.norm(jd_vec)

    # candidate vectors: profile (headline+summary) and career (descriptions)
    prof_text = [(h + ". " + s).strip() for h, s in zip(headline, summary)]
    print("[emb] encoding profile text ...")
    t0 = time.time()
    emb_prof = model.encode(prof_text, normalize_embeddings=True, batch_size=256,
                            convert_to_numpy=True, show_progress_bar=True)
    print(f"  profile: {time.time()-t0:.1f}s")
    print("[emb] encoding career text ...")
    t0 = time.time()
    emb_car = model.encode(career, normalize_embeddings=True, batch_size=256,
                           convert_to_numpy=True, show_progress_bar=True)
    print(f"  career: {time.time()-t0:.1f}s")

    sim_prof = emb_prof @ jd_vec
    sim_car = emb_car @ jd_vec
    semantic_cosine = 0.4 * sim_prof + 0.6 * sim_car   # career-weighted (descriptions matter more)

    sem = pd.DataFrame({"candidate_id": ids, "sim_profile": sim_prof, "sim_career": sim_car,
                        "semantic_cosine": semantic_cosine})
    sem["semantic_fit"] = sem["semantic_cosine"].rank(pct=True)   # [0,1] normalized

    # save reusable artifacts
    np.save(os.path.join(ART, "emb_profile.npy"), emb_prof.astype(np.float32))
    np.save(os.path.join(ART, "emb_career.npy"), emb_car.astype(np.float32))
    np.save(os.path.join(ART, "jd_vec.npy"), jd_vec.astype(np.float32))
    pd.Series(ids, name="candidate_id").to_csv(os.path.join(ART, "emb_ids.csv"), index=False)

    # ---- merge into feature parquet ----
    feat = pd.read_parquet(os.path.join(ART, "candidate_features.parquet"))
    if "semantic_fit" in feat.columns: feat = feat.drop(columns=["semantic_fit"])
    feat = feat.merge(sem[["candidate_id","sim_profile","sim_career","semantic_cosine","semantic_fit"]],
                      on="candidate_id", how="left")
    feat.to_parquet(os.path.join(ART, "candidate_features.parquet"), index=False)
    print(f"[emb] merged semantic_fit into parquet -> shape {feat.shape}")

    # ================= keyword vs semantic vs hybrid =================
    df = feat.copy()
    tw = {"core_ml":1.0,"ml_adjacent":0.6,"swe_generic":0.25,"non_eng":0.0}
    df["title_w"] = df["current_title_class"].map(tw).fillna(0)
    df["kw_evidence"] = np.clip((df["evid_strong_ir"]*1.0 + df["evid_med_ml"]*0.3
                                 + df["evid_eval"]*0.5 + df["evid_deploy"]*0.2)/8.0, 0, 1)
    df["keyword_score"] = 0.5*df["title_w"] + 0.5*df["kw_evidence"]
    df["semantic_norm"] = df["semantic_fit"]
    hp = df["honeypot_flag"].astype(bool)
    df["hybrid_score"] = (0.55*df["semantic_norm"] + 0.45*df["keyword_score"]) * df["avail_modifier"]
    df.loc[hp, "hybrid_score"] = -1   # honeypots excluded in hybrid

    def topk(col, k=100):
        return df.sort_values(col, ascending=False).head(k)
    def profile(sub, name):
        n = len(sub)
        core = (sub["current_title_class"].isin(["core_ml","ml_adjacent"])).mean()*100
        prod = (sub["current_company_class"].isin(["product","ai_product"])).mean()*100
        noise = (sub["current_title_class"]=="non_eng").mean()*100
        hpn = int(sub["honeypot_flag"].astype(bool).sum())
        band = sub["yoe"].between(5,9).mean()*100
        retr = (sub["evid_strong_ir"]>=1).mean()*100
        print(f"  {name:14s} | core/adj {core:5.1f}% | product {prod:5.1f}% | "
              f"noise {noise:5.1f}% | retr-evid {retr:5.1f}% | yoe5-9 {band:5.1f}% | honeypots {hpn}")

    kw, se, hy = topk("keyword_score"), topk("semantic_cosine"), topk("hybrid_score")
    print("\n================ TOP-100 RANKING COMPARISON ================")
    profile(kw, "keyword-only"); profile(se, "semantic-only"); profile(hy, "hybrid")
    setk, setse, sethy = set(kw.candidate_id), set(se.candidate_id), set(hy.candidate_id)
    print(f"\n  overlap kw&sem: {len(setk&setse)} | kw&hyb: {len(setk&sethy)} | "
          f"sem&hyb: {len(setse&sethy)} | all three: {len(setk&setse&sethy)}")

    # ---- examples: semantic finds, keyword misses ----
    car_map = dict(zip(ids, career))
    cand = df[(df["current_title_class"].isin(["core_ml","ml_adjacent"])) &
              (df["evid_strong_ir"]==0) & (~hp) &
              (df["current_company_class"].isin(["product","ai_product"]))]
    cand = cand.sort_values("semantic_cosine", ascending=False).head(8)
    print("\n========== SEMANTIC CATCHES KEYWORD MISSES (evid_strong_ir==0) ==========")
    for _, r in cand.iterrows():
        snip = car_map.get(r["candidate_id"], "")[:200].replace("\n"," ")
        print(f"\n  {r['candidate_id']} | {r['current_title']} @ {r['current_company']} "
              f"| yoe {r['yoe']} | sem_cos {r['semantic_cosine']:.3f} (rank {r['semantic_fit']:.3f})")
        print(f"    desc: {snip}")

    # ================= twin / duplicate detection =================
    print("\n================ TWIN / DUPLICATE DETECTION ================")
    # (a) exact full-profile twins: identical summary + career text + skill set
    sig = [hashlib.md5((summary[i] + "||" + career[i] + "||" + "|".join(skillsig[i])).encode("utf-8")).hexdigest()
           for i in range(len(ids))]
    sdf = pd.DataFrame({"candidate_id": ids, "sig": sig})
    grp = sdf.groupby("sig").size()
    dup_sigs = grp[grp >= 2]
    exact_dup_ids = set(sdf[sdf["sig"].isin(dup_sigs.index)]["candidate_id"])
    print(f"  exact-profile duplicate clusters: {len(dup_sigs)} | candidates in them: {len(exact_dup_ids)}")

    # (b) near-twin via embeddings, restricted to the relevant subpool (where twins are dangerous)
    id2ix = {c: i for i, c in enumerate(ids)}
    pool = df[(df["semantic_cosine"] >= np.quantile(df["semantic_cosine"], 0.95))].copy()
    pidx = [id2ix[c] for c in pool["candidate_id"]]
    V = emb_car[pidx]
    sim = V @ V.T
    np.fill_diagonal(sim, 0)
    near_pairs = np.argwhere(sim > 0.985)
    near_ids = set()
    for a, b in near_pairs:
        if a < b:
            near_ids.add(pool.iloc[a]["candidate_id"]); near_ids.add(pool.iloc[b]["candidate_id"])
    print(f"  near-twin (career cos>0.985) within top-5% pool: {len(near_ids)} candidates "
          f"in {len(near_pairs)//2} pairs")

    suspicious = (exact_dup_ids | near_ids)
    already_hp = set(df[df["honeypot_flag"].astype(bool)]["candidate_id"])
    additional = suspicious - already_hp
    df["twin_flag"] = df["candidate_id"].isin(suspicious)
    feat = feat.merge(df[["candidate_id","twin_flag"]], on="candidate_id", how="left")
    feat["twin_flag"] = feat["twin_flag"].fillna(False)
    feat.to_parquet(os.path.join(ART, "candidate_features.parquet"), index=False)
    print(f"  total suspicious (exact∪near): {len(suspicious)} | "
          f"already honeypot-flagged: {len(suspicious & already_hp)} | "
          f"ADDITIONAL caught: {len(additional)}")
    print(f"  twin_flag merged into parquet. final shape {feat.shape}")

if __name__ == "__main__":
    main()
