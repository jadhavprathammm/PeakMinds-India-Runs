# Phase 3 — Ranking Architecture, Formula & Evaluation

## 1. Architecture (multi-stage funnel)
```
candidates.jsonl (100k)
   │  [OFFLINE PRECOMPUTE — may exceed 5 min, documented]
   ├─ build_features.py      → candidate_features.parquet (98 deterministic features)
   ├─ build_embeddings.py    → emb_profile.npy / emb_career.npy / jd_vec.npy → semantic_fit
   ├─ fix_twin_flag.py       → twin_flag (structural-clone detection)
   └─ build_reasoning_facts.py → reasoning_facts.parquet (top skills + role snippet)
   │
   ▼  [RANKING STEP — rank.py, loads artifacts only, CPU, no network, 0.5 s ≪ 300 s budget]
   1. score_dataframe()  → 7 pillar sub-scores → S_fit → ×availability → gate penalties → S, tier
   2. sort by [score desc, candidate_id asc]  (validator tie-break rule)
   3. take top-100 → grounded reasoning (rank-banded, honest concerns)
   4. write submissions/<team>.csv  → passes validate_submission.py
```
Design rationale: every expensive operation (parsing 465 MB, 200k embeddings) is precomputed; the reproducible **ranking step is a load + vectorized-score + sort**, so it runs in <1 s and trivially satisfies the 5-min / 16 GB / CPU / offline Stage-3 constraints.

## 2. Final ranking score formula
**Pillar sub-scores** (each ∈ [0,1]):
| Pillar | Definition |
|---|---|
| RoleDomain | `0.30·title_fit + 0.40·semantic_fit + 0.30·evidence` ; `evidence = clip((strong_ir·1 + med_ml·0.3 + eval·0.6 + deploy·0.2)/6, 0,1)` ; `title_fit = {core_ml 1.0, ml_adjacent 0.6, swe 0.25, non_eng 0.0}` |
| ExperienceProfile | `0.45·years_band + 0.40·applied_ml + 0.15·scale` ; `years_band = exp(−((yoe−7)/3)²)` ; `applied_ml = clip(applied_ml_years/4,0,1)` |
| ProductPedigree | `clip(0.6·product_ratio + 0.2·is_ai_product + 0.2·ext_val, 0,1)` ; `ext_val = 0.7·github/100 + 0.3·clip(certs/2,0,1)` |
| PreLLMDepth | `1.0 if pre-2021 ML else 0.5 if applied_ml≥2 else 0.3 if med_ml≥1 else 0` ; `0` if recent-LLM-only gate |
| LocationLogistics | `0.6·loc_adj + 0.4·notice_score` ; loc A=1.0/B=0.85/C=0.6(→0.8 if relocate)/D=0.25 |
| TenureStability | `clip(avg_tenure/30 − 0.2·n_short_stints, 0,1)` |
| TrustValidation | `0.4·completeness/100 + 0.2·verified_email + 0.2·verified_phone + 0.2·linkedin` |

**Fit score (additive):**
```
S_fit = 0.42·RoleDomain + 0.18·Experience + 0.12·ProductPedigree
      + 0.08·PreLLMDepth + 0.08·Location + 0.07·Tenure + 0.05·Trust
```
**Availability modifier (multiplicative, hireability):** `avail_modifier ∈ [0.50,1.10]` (from activity recency, recruiter response, open-to-work, interview completion — precomputed in features).
```
S = S_fit · avail_modifier
```
**Hard gates (cap tier + depress S for ordering):**
| Gate | S penalty | tier cap |
|---|---|---|
| honeypot_flag / twin_flag | S = −1 (excluded) | 0 |
| wrong_role_stuffer | ×0.10 | 1 |
| services_only | ×0.50 | 1 |
| research_only | ×0.60 | 1 |
| cv_primary | ×0.60 | 2 |
| recent_llm_only | ×0.60 | 2 |

**Final ranking key:** `score = round(S,6)`, sort by `[score desc, candidate_id asc]`, ranks 1–100.

## 3. Tier system (T0–T5)
Assigned from penalized S then capped by gates: **T5 ≥ 0.80, T4 ≥ 0.62, T3 ≥ 0.45, T2 ≥ 0.30, T1 ≥ 0.15, else T0.**
Population pyramid: T5 = 237 (elite ~0.25%), T4 = 852, T3 = 3,033, T2 = 1,495, T1 = 7,583, T0 = 86,800.
(Tiers drive reasoning tone, gold-set evaluation, and gate consistency; the submission `score` is the continuous S so NDCG sees fine-grained order.)

## 4. Weight calibration
- Pillar weights inherited from the approved rubric; tier cutoffs calibrated against the empirical 100k S distribution (T5 set to the elite ~0.25%).
- Validated by **ablation on a silver simulation set** (`simulate_ranking.py`): availability is the dominant lever (composite 0.944→0.770 when removed); gates protect NDCG@50 and exclude honeypots; semantic is order-neutral on coarse tiers (its measurable value is intra-T5 ordering → flagged for human-gold calibration).
- **Open calibration items for human gold:** semantic weight (0.40 in RoleDomain) and the exact T4/T5 cutoff.

## 5. Evaluation framework
- `src/evaluation.py` — `NDCG@k` (graded, gain `2^rel−1`), `P@k` (rel ≥ 3), `MAP`, and the official `composite = 0.50·NDCG@10 + 0.30·NDCG@50 + 0.15·MAP + 0.05·P@10`.
- `build_gold_set.py` — exports `gold_set_to_label.csv` (199 candidates, 10 strata over-weighting hard cases) as a two-rater human labeling instrument; reconcile → `gold_tier` → tune.
- `simulate_ranking.py` — silver self-validation (representative real candidates, rubric-derived expected tiers) + ablation. **Proxy only**; final tuning uses human gold.

## 6. Submission pipeline
`rank.py` → `submissions/team_redrob.csv` — exactly 100 rows, header `candidate_id,rank,score,reasoning`, ranks 1–100 unique, score non-increasing, id-ascending tie-break. **Passes `validate_submission.py` ("Submission is valid").** Top-100: 100% core-ML titles, 96% product/AI companies, 92% in the 5–9 band, **0 honeypots**.
