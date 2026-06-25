"""
Finalize the embeddings sub-step WITHOUT re-encoding:
- reuse saved emb_profile.npy / emb_career.npy / jd_vec.npy
- clean the parquet (drop suffixed/duplicate semantic cols), re-merge clean semantic_fit
- keyword vs semantic vs hybrid comparison + semantic-catch examples + twin detection
"""
import io, json, os, sys, hashlib
from pathlib import Path
import numpy as np, pandas as pd
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_embeddings import load_texts

_HERE = Path(__file__).resolve().parent
ART   = Path(os.environ.get("ARTIFACTS_DIR",   str(_HERE / "artifacts")))
CAND  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent / "data" / "candidates.jsonl")))

emb_prof = np.load(os.path.join(ART, "emb_profile.npy"))
emb_car = np.load(os.path.join(ART, "emb_career.npy"))
jd_vec = np.load(os.path.join(ART, "jd_vec.npy"))
ids = pd.read_csv(os.path.join(ART, "emb_ids.csv"))["candidate_id"].tolist()
print(f"[finalize] emb_profile {emb_prof.shape} emb_career {emb_car.shape} ids {len(ids)}")

sim_prof = emb_prof @ jd_vec
sim_car = emb_car @ jd_vec
semantic_cosine = 0.4 * sim_prof + 0.6 * sim_car
sem = pd.DataFrame({"candidate_id": ids, "sim_profile": sim_prof, "sim_career": sim_car,
                    "semantic_cosine": semantic_cosine})
sem["semantic_fit"] = sem["semantic_cosine"].rank(pct=True)

# clean parquet: drop any prior semantic/twin cols (suffixed or not)
feat = pd.read_parquet(os.path.join(ART, "candidate_features.parquet"))
drop = [c for c in feat.columns if ("sim_" in c) or ("semantic" in c) or ("twin" in c)]
feat = feat.drop(columns=drop)
feat = feat.merge(sem, on="candidate_id", how="left")
print(f"[finalize] cleaned (dropped {drop}); merged -> {feat.shape}")

# ---- restream texts for examples + twin signatures ----
print("[finalize] restreaming texts for examples/twins ...")
ids2, headline, summary, career, skillsig, caresig = load_texts(CAND)
car_map = dict(zip(ids2, career))

# ================= keyword vs semantic vs hybrid =================
df = feat.copy()
tw = {"core_ml":1.0,"ml_adjacent":0.6,"swe_generic":0.25,"non_eng":0.0}
df["title_w"] = df["current_title_class"].map(tw).fillna(0)
df["kw_evidence"] = np.clip((df["evid_strong_ir"]*1.0 + df["evid_med_ml"]*0.3
                             + df["evid_eval"]*0.5 + df["evid_deploy"]*0.2)/8.0, 0, 1)
df["keyword_score"] = 0.5*df["title_w"] + 0.5*df["kw_evidence"]
hp = df["honeypot_flag"].astype(bool)
df["hybrid_score"] = (0.55*df["semantic_fit"] + 0.45*df["keyword_score"]) * df["avail_modifier"]
df.loc[hp, "hybrid_score"] = -1

def topk(col, k=100): return df.sort_values(col, ascending=False).head(k)
def profile(sub, name):
    core = (sub["current_title_class"].isin(["core_ml","ml_adjacent"])).mean()*100
    prod = (sub["current_company_class"].isin(["product","ai_product"])).mean()*100
    noise = (sub["current_title_class"]=="non_eng").mean()*100
    hpn = int(sub["honeypot_flag"].astype(bool).sum())
    band = sub["yoe"].between(5,9).mean()*100
    retr = (sub["evid_strong_ir"]>=1).mean()*100
    avail = sub["avail_modifier"].mean()
    print(f"  {name:14s} | core/adj {core:5.1f}% | product {prod:5.1f}% | noise {noise:5.1f}% | "
          f"retr-evid {retr:5.1f}% | yoe5-9 {band:5.1f}% | avail {avail:.3f} | honeypots {hpn}")

kw, se, hyb = topk("keyword_score"), topk("semantic_cosine"), topk("hybrid_score")
print("\n================ TOP-100 RANKING COMPARISON ================")
profile(kw, "keyword-only"); profile(se, "semantic-only"); profile(hyb, "hybrid")
setk, setse, sethy = set(kw.candidate_id), set(se.candidate_id), set(hyb.candidate_id)
print(f"\n  overlap kw&sem: {len(setk&setse)} | kw&hyb: {len(setk&sethy)} | "
      f"sem&hyb: {len(setse&sethy)} | all three: {len(setk&setse&sethy)}")

# ---- semantic catches keyword misses ----
cand = df[(df["current_title_class"].isin(["core_ml","ml_adjacent"])) & (df["evid_strong_ir"]==0) &
          (~hp) & (df["current_company_class"].isin(["product","ai_product"]))]
cand = cand.sort_values("semantic_cosine", ascending=False).head(8)
print("\n========== SEMANTIC CATCHES KEYWORD MISSES (no explicit IR keywords) ==========")
for _, r in cand.iterrows():
    snip = (car_map.get(r["candidate_id"], "")[:200]).replace("\n", " ")
    print(f"\n  {r['candidate_id']} | {r['current_title']} @ {r['current_company']} | yoe {r['yoe']} "
          f"| sem_cos {r['semantic_cosine']:.3f} (fit {r['semantic_fit']:.3f}) | kw_score {r['keyword_score']:.3f}")
    print(f"    desc: {snip}")

# ================= twin / duplicate detection =================
print("\n================ TWIN / DUPLICATE DETECTION ================")
sig = [hashlib.md5((summary[i] + "||" + career[i] + "||" + "|".join(skillsig[i])).encode("utf-8")).hexdigest()
       for i in range(len(ids2))]
sdf = pd.DataFrame({"candidate_id": ids2, "sig": sig})
grp = sdf.groupby("sig").size(); dup_sigs = grp[grp >= 2]
exact_dup_ids = set(sdf[sdf["sig"].isin(dup_sigs.index)]["candidate_id"])
print(f"  exact-profile duplicate clusters: {len(dup_sigs)} | candidates in them: {len(exact_dup_ids)}")

id2ix = {c: i for i, c in enumerate(ids)}
thr = np.quantile(df["semantic_cosine"], 0.95)
pool = df[df["semantic_cosine"] >= thr].copy()
pidx = [id2ix[c] for c in pool["candidate_id"]]
V = emb_car[pidx]
sim = V @ V.T; np.fill_diagonal(sim, 0)
pairs = np.argwhere(sim > 0.985)
near_ids = set()
for a, b in pairs:
    if a < b:
        near_ids.add(pool.iloc[a]["candidate_id"]); near_ids.add(pool.iloc[b]["candidate_id"])
print(f"  near-twin (career cos>0.985) within top-5% pool ({len(pool)}): "
      f"{len(near_ids)} candidates in {len(pairs)//2} pairs")

suspicious = exact_dup_ids | near_ids
already_hp = set(df[hp]["candidate_id"])
additional = suspicious - already_hp
feat["twin_flag"] = feat["candidate_id"].isin(suspicious)
feat.to_parquet(os.path.join(ART, "candidate_features.parquet"), index=False)
print(f"  total suspicious (exact|near): {len(suspicious)} | overlap w/ honeypots: {len(suspicious & already_hp)} "
      f"| ADDITIONAL caught: {len(additional)}")
print(f"\n[finalize] clean parquet saved -> shape {feat.shape}; "
      f"semantic_fit non-null {int(feat['semantic_fit'].notna().sum())}")
