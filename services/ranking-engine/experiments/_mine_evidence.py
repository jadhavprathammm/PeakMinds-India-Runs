"""Phase 2 prep #2: mine ML/retrieval evidence vocab + confirm honeypot signatures."""
import json, io, re, os
from collections import Counter
from pathlib import Path
import numpy as np
_HERE = Path(__file__).resolve().parent
PATH  = Path(os.environ.get("CANDIDATES_PATH", str(_HERE.parent.parent.parent / "data" / "candidates.jsonl")))

EVID = ['retrieval','ranking','re-rank','rerank','recommendation','recommender','recsys',
        'embedding','embeddings','semantic search','vector','faiss','pinecone','weaviate',
        'qdrant','milvus','opensearch','elasticsearch','rag','nlp','natural language',
        'information retrieval','learning to rank','ndcg','mrr','search relevance','bm25',
        'transformer','bert','llm','fine-tun','sentence-transformer','knn','ann ',
        'personalization','candidate generation','two-tower','matching']
evid_ct = Counter()
title_with_evid = Counter()
n=0; n_any_evid=0
hp_expert0=0; hp_tenure_gt_yoe=0; hp_sum_gt_yoe=0; hp_start_before_career=0; hp_current_with_end=0
hp_candidates=set()
ml_titles = {'ML Engineer','AI Research Engineer','Data Scientist','Senior Software Engineer (ML)',
 'Computer Vision Engineer','Junior ML Engineer','AI Specialist','Recommendation Systems Engineer',
 'Machine Learning Engineer','Search Engineer','AI Engineer','Applied ML Engineer','NLP Engineer',
 'Senior Data Scientist','Data Engineer','Analytics Engineer','Senior Data Engineer'}
ml_role_descs=[]
gh_neg=0; off_neg=0

def year(d):
    try: return int(d[:4])
    except: return None

with io.open(PATH, encoding="utf-8") as f:
    for line in f:
        if not line.strip(): continue
        r=json.loads(line); n+=1
        p=r.get("profile",{}); rs=r.get("redrob_signals",{}); ch=r.get("career_history",[])
        yoe=p.get("years_of_experience") or 0
        cid=r["candidate_id"]
        # evidence scan over summary + descriptions
        text=(p.get("summary","")+" "+" ".join(j.get("description","") for j in ch)).lower()
        hit=False
        for kw in EVID:
            if kw in text:
                evid_ct[kw]+=1; hit=True
        if hit:
            n_any_evid+=1
            title_with_evid[p.get("current_title","")]+=1
        # capture some real ML-role descriptions
        if p.get("current_title") in ml_titles and len(ml_role_descs)<30:
            for j in ch:
                if j.get("is_current") and j.get("description"):
                    ml_role_descs.append((p.get("current_title"), j["description"][:300]))
                    break
        # honeypot signatures
        for s in r.get("skills",[]):
            if s.get("proficiency") in ("advanced","expert") and (s.get("duration_months") or 0)==0:
                hp_expert0+=1; hp_candidates.add(cid)
        durs=[j.get("duration_months") or 0 for j in ch]
        if durs and max(durs) > yoe*12 + 6:
            hp_tenure_gt_yoe+=1; hp_candidates.add(cid)
        if sum(durs) > yoe*12*1.5 + 12:   # heavy overlap/impossible
            hp_sum_gt_yoe+=1; hp_candidates.add(cid)
        starts=[year(j.get("start_date","")) for j in ch if j.get("start_date")]
        if starts and min(starts) < (2026 - yoe - 2):
            hp_start_before_career+=1; hp_candidates.add(cid)
        for j in ch:
            if j.get("is_current") and j.get("end_date"):
                hp_current_with_end+=1; hp_candidates.add(cid); break
        if (rs.get("github_activity_score")==-1): gh_neg+=1
        if (rs.get("offer_acceptance_rate")==-1): off_neg+=1

print("N=",n,"| any-evidence candidates:",n_any_evid,"(%.2f%%)"%(100*n_any_evid/n))
print("github=-1:",gh_neg,"(%.1f%%)  offer_acc=-1:"%(100*gh_neg/n),off_neg,"(%.1f%%)"%(100*off_neg/n))
print("\n== EVIDENCE KEYWORD HITS (candidates containing) ==")
for k,v in evid_ct.most_common(): print(" %6d  %s"%(v,k))
print("\n== TITLES that contain ML evidence (top25) ==")
for k,v in title_with_evid.most_common(25): print(" %6d  %r"%(v,k))
print("\n== HONEYPOT SIGNATURE COUNTS ==")
print(" expert/advanced@0dur rows:",hp_expert0)
print(" max single tenure > yoe*12+6:",hp_tenure_gt_yoe)
print(" sum tenure > yoe*18+12:",hp_sum_gt_yoe)
print(" earliest start before (2026-yoe-2):",hp_start_before_career)
print(" is_current but has end_date:",hp_current_with_end)
print(" UNION distinct honeypot-flagged candidates:",len(hp_candidates))
print("\n== SAMPLE REAL ML-ROLE CURRENT DESCRIPTIONS ==")
for t,d in ml_role_descs[:18]: print(f" [{t}] {d}")
