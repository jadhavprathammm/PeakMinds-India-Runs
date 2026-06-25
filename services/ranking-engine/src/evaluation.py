"""
Ranking metrics matching the challenge composite:
  composite = 0.50*NDCG@10 + 0.30*NDCG@50 + 0.15*MAP + 0.05*P@10
Graded relevance = tier (0-5). "Relevant" for P@k / MAP = tier >= REL_THRESHOLD (3).
"""
import numpy as np
REL_THRESHOLD = 3

def dcg(rels):
    rels = np.asarray(rels, dtype=float)
    disc = 1.0 / np.log2(np.arange(2, len(rels) + 2))
    return float(np.sum((2**rels - 1) * disc))

def ndcg_at_k(ranked_rels, all_rels, k):
    ranked_rels = list(ranked_rels)[:k]
    ideal = sorted(all_rels, reverse=True)[:k]
    idcg = dcg(ideal)
    return dcg(ranked_rels) / idcg if idcg > 0 else 0.0

def precision_at_k(ranked_rels, k, thr=REL_THRESHOLD):
    r = np.asarray(ranked_rels[:k])
    return float(np.mean(r >= thr)) if len(r) else 0.0

def average_precision(ranked_rels, total_relevant=None, thr=REL_THRESHOLD):
    r = np.asarray(ranked_rels)
    rel = (r >= thr).astype(int)
    if total_relevant is None:
        total_relevant = int(rel.sum())
    if total_relevant == 0:
        return 0.0
    hits, ap = 0, 0.0
    for i, x in enumerate(rel, start=1):
        if x:
            hits += 1
            ap += hits / i
    return ap / total_relevant

def composite(ranked_rels, all_rels):
    """ranked_rels: relevance of OUR ranking in order; all_rels: relevance of full pool."""
    total_rel = int(np.sum(np.asarray(all_rels) >= REL_THRESHOLD))
    n10 = ndcg_at_k(ranked_rels, all_rels, 10)
    n50 = ndcg_at_k(ranked_rels, all_rels, 50)
    mp = average_precision(ranked_rels, total_relevant=total_rel)
    p10 = precision_at_k(ranked_rels, 10)
    comp = 0.50*n10 + 0.30*n50 + 0.15*mp + 0.05*p10
    return dict(NDCG_10=n10, NDCG_50=n50, MAP=mp, P_10=p10, composite=comp)
