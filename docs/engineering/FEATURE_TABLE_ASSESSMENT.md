# Feature-Table Split: Engineering Assessment

_Analysis only. No files were modified._

---

## Executive Summary

The repository maintains two completely separate feature tables that share only
13 column names out of a combined 119 distinct columns. They were produced by
two different extractors, encode fundamentally different modeling objectives,
and have never converged. The EDA's quality conclusions are based on signals the
ranker does not use. The divergence does **not** block submission — the ranking
pipeline is self-contained — but it means the EDA provides no empirical
validation of the ranker's feature choices.

---

## 1. Which Feature Table Does the EDA Use?

**File:** `Datasets/candidate_features.csv`  
**Writer:** `_featurize_tmp.py` (the underscore-prefixed scratch extractor)  
**Consumers:** `analyze_candidates.py`, `analyze_candidates_b.py`, `quality_score.py`  
**Schema:** 34 columns, 100,000 rows

---

## 2. Which Feature Table Does the Ranking Pipeline Use?

**File:** `artifacts/candidate_features.parquet`  
**Writer:** `build_features.py` → `src/features.py`  
**Consumers:** `build_embeddings.py`, `finalize_embeddings.py`, `fix_twin_flag.py`,
`calibrate_thresholds.py`, `simulate_ranking.py`, `build_gold_set.py`, `rank.py`  
**Schema:** 98 columns, 100,000 rows (grows to 98 after embedding + twin steps)

---

## 3. How the Schemas Differ

### 3a. Shared by exact column name (13 columns)

```
candidate_id            current_company_size     current_industry
certification_count     profile_completeness_score
recruiter_response_rate interview_completion_rate
github_activity_score   open_to_work_flag        willing_to_relocate
verified_email          verified_phone           linkedin_connected
```

These are a mix of trust signals and redrob-signal passthrough fields.
They represent ~38% of the EDA table and ~13% of the ranking table.

### 3b. EDA-only columns (21)

```
years_of_experience          total_jobs
average_job_duration_months  current_job_duration_months
number_of_industries_worked_in
highest_degree               best_tier_education   education_count
total_skills                 advanced_skills_count
total_endorsements           average_skill_duration
top_skills                   language_count
profile_views_received_30d   applications_submitted_30d
offer_acceptance_rate        search_appearance_30d
saved_by_recruiters_30d
expected_salary_min_lpa      expected_salary_max_lpa
```

None of these appear in the ranking parquet under any name.
The six highlighted below are the pillars of the EDA quality score:

| EDA column | Weight in quality_score.py | In ranking table? |
|---|---|---|
| `total_endorsements` | 12 / 100 (highest single weight) | No |
| `saved_by_recruiters_30d` | 11 / 100 | No |
| `search_appearance_30d` | 9 / 100 | No |
| `advanced_skills_count` | 9 / 100 | No |
| `profile_views_received_30d` | 8 / 100 | No |
| `offer_acceptance_rate` | 6 / 100 | No |

These six together account for **55% of the EDA quality score** and 0% of the
ranking model.

### 3c. Ranking-only columns (85)

The 85 columns not present in the EDA table include every feature the ranker
actually scores on:

| Category | Ranking columns (selected) | Scoring weight |
|---|---|---|
| Role fit | `current_title_class`, `evid_strong_ir`, `evid_med_ml`, `evid_eval`, `evid_deploy`, `semantic_fit` | 42% of S_fit |
| Experience | `applied_ml_years`, `n_short_stints`, `has_pre_llm_ml` | 18% of S_fit |
| Product depth | `product_ratio`, `current_is_ai_product` | 12% of S_fit |
| Pre-LLM depth | `has_pre_llm_ml`, `ai_evidence_recent_only` | 8% of S_fit |
| Location | `location_tier`, `location_score`, `notice_score` | 8% of S_fit |
| Tenure | `avg_tenure_months`, `n_short_stints` | 7% of S_fit |
| Availability | `avail_modifier` | multiplier on entire S |
| Fraud | `honeypot_flag`, `twin_flag` | S = -1 (excluded) |
| Gates | `gate_services_only`, `gate_research_only`, etc. | S penalty + tier cap |

### 3d. Renamed columns (same concept, different name)

| EDA name | Ranking name | Comment |
|---|---|---|
| `years_of_experience` | `yoe` | identical source field |
| `total_jobs` | `n_jobs` | identical computation |
| `average_job_duration_months` | `avg_tenure_months` | identical computation |
| `current_job_duration_months` | `current_tenure_months` | identical computation |
| `expected_salary_min_lpa` | `expected_salary_min` | identical source field |
| `expected_salary_max_lpa` | `expected_salary_max` | identical source field |
| `best_tier_education` (string) | `best_edu_tier` (int) | same concept; EDA converts back to string |
| `applications_submitted_30d` | `applications_30d` | identical source field |

---

## 4. Why the Divergence Exists

**`_featurize_tmp.py`** was written first, as a rapid EDA instrument to answer
"what distributions does this dataset have?" It extracted everything in the JSON
that looked measurable — skills, endorsements, salary, platform engagement — and
wrote a flat CSV for quick analysis. The naming style (`years_of_experience`,
`total_jobs`) mirrors the raw JSON field names.

**`src/features.py`** was written later, from scratch, to implement the approved
rubric. It has a completely different scope: classify titles into rubric tiers,
count IR-domain evidence keywords, detect honeypot anomalies, compute availability
modifiers, and derive gate booleans. It uses `yoe`-style short names and adds
~70 features that have no equivalent in the JSON (they are computed from it).

The two extractors were never intended to converge. They were written for
different purposes and neither was updated to reflect changes in the other.

---

## 5. Ranking Features Missing from the EDA Table

**Every single scoring signal is absent from the EDA table.** The ranking score
`S` is a function of:

```
S_fit = 0.42·sc_role + 0.18·sc_exp + 0.12·sc_prod + 0.08·sc_prellm
      + 0.08·sc_loc + 0.07·sc_tenure + 0.05·sc_trust
S = S_fit × avail_modifier  (then gate penalties applied)
```

The inputs to every sub-score are ranking-only columns:

- **sc_role** depends on `current_title_class`, `semantic_fit`, `evid_strong_ir`,
  `evid_med_ml`, `evid_eval`, `evid_deploy` — none in EDA.
- **sc_exp** depends on `yoe` (renamed), `applied_ml_years`, `evid_scale` — none
  in EDA except `yoe` under a different name.
- **sc_prod** depends on `product_ratio`, `current_is_ai_product`, `has_github`,
  `github_activity_score` (shared), `certification_count` (shared) — mostly absent.
- **sc_prellm** depends on `has_pre_llm_ml`, `applied_ml_years`, `evid_med_ml` — none in EDA.
- **sc_loc** depends on `location_tier`, `location_score`, `notice_score` — none in EDA.
- **sc_tenure** depends on `avg_tenure_months` (renamed), `n_short_stints` — absent.
- **avail_modifier** — absent entirely; this is a composite computed at extraction time.
- **honeypot_flag**, **twin_flag**, **all gates** — absent entirely.

The EDA table cannot reproduce `S` or any of its sub-scores. There is no way to
audit ranking decisions from the EDA table.

---

## 6. EDA Conclusions That Become Invalid

### 6a. The quality score (quality_score.py) does not model the ranker

`quality_score.py` builds a `quality_score` (0–100) and a tier band (D/C/B/A/A+).
These are derived entirely from EDA features. The ranker's tiers (0–5) and
score `S` are derived entirely from ranking features. The two scoring systems:

- Use **different inputs** (EDA relies heavily on `saved_by_recruiters_30d`,
  `total_endorsements`, `search_appearance_30d` — all absent from the ranker)
- **Optimize different objectives** (platform engagement vs. JD relevance)
- Produce **incomparable scales** (0–100 percentile-rank vs. 0–1 weighted pillar sum)

A candidate in tier A+ by the EDA quality score could be tier 0 by the ranker
(e.g. a highly endorsed non-engineer with a long platform history).

### 6b. Top-10 quality indicators (analyze_candidates_b.py) do not reflect what the ranker uses

The EDA identifies the most important quality indicators by computing:
- PC1 loading from a PCA on the 22 EDA numeric features
- Spearman correlation with `saved_by_recruiters_30d` as a recruiter-behaviour proxy

The result identifies `total_endorsements`, `saved_by_recruiters_30d`,
`advanced_skills_count`, and `search_appearance_30d` as the most important
signals. None of these exist in the ranking table. Any decision to upweight these
features based on the EDA would have had no effect on `rank.py`.

### 6c. The PCA latent quality factor is derived from the wrong feature space

The PCA in `analyze_candidates_b.py` operates on 21 numeric EDA columns.
The ranker's feature space has 85 additional columns not present in the EDA.
The latent "quality factor" identified by the PCA describes structure in
`{endorsements, skills, platform engagement}` — not structure in
`{title class, IR evidence, product background, availability}`.

### 6d. Conclusions that remain valid

The following EDA outputs are based on columns that exist correctly in both
tables and are not invalidated by the split:

- Distribution and outlier analysis of: `recruiter_response_rate`,
  `interview_completion_rate`, `profile_completeness_score`, `github_activity_score`
  (after sentinel replacement), `verified_email/phone/linkedin`, `certification_count`
- Correlation patterns among those 12 shared numeric signals
- Sentinel rate detection (`offer_acceptance_rate` 59.6% = -1,
  `github_activity_score` 64.6% = -1) — both tables handle these correctly

---

## 7. Source of Truth

**`artifacts/candidate_features.parquet` is the unambiguous source of truth.**

Reasons:

1. It is the direct input to `rank.py`, which produces the actual submission.
2. It implements the approved rubric (`relevance_rubric.md`) rather than a generic
   feature dump.
3. It has been validated against the challenge metric via `simulate_ranking.py`
   (ablation study) and `calibrate_thresholds.py` (threshold inspection).
4. `build_gold_set.py` samples from it for human labeling, meaning any
   ground-truth labels will be collected against the parquet's features.
5. Its sentinel handling for `github_activity_score` is cleaner: -1 is
   converted to NaN at extraction time rather than post-hoc. This avoids
   any window where -1 could be accidentally treated as a valid value.

The EDA CSV is a development artifact. It should not be used to draw conclusions
about the ranking model.

---

## 8. Reconciliation Requirement Before Production

### Submission correctness: No reconciliation needed

The submission file `submissions/team_redrob.csv` is produced entirely by `rank.py`
reading `artifacts/candidate_features.parquet`. The EDA CSV is not on this path.
The divergence has zero effect on submission output.

### Feature validation gap: Reconciliation is recommended (not blocking)

The EDA was presumably intended to inform decisions about which features matter and
how to weight them. Because the EDA operates on a different feature set, it has
provided no empirical validation of the ranker's actual features. Specifically:

- **Unvalidated:** Does `evid_strong_ir` actually correlate with favorable
  recruiter outcomes? The EDA cannot answer this because `evid_strong_ir` is
  not in the EDA table.
- **Unvalidated:** Does `product_ratio` distinguish candidates that recruiters
  prefer? The EDA cannot answer this.
- **Unvalidated:** Does `avail_modifier` correctly penalize low-availability
  candidates? The EDA's closest proxy (`recruiter_response_rate`) exists in both
  tables but is only a sub-component of `avail_modifier`.

### Recommended reconciliation action

Run the EDA correlation analysis and top-N indicator extraction **against
`artifacts/candidate_features.parquet`**, not the EDA CSV. A focused script
could compute Spearman correlations of the 85 ranking-only features against
`saved_by_recruiters_30d` — but `saved_by_recruiters_30d` is not in the parquet
either, so this requires a two-table join on `candidate_id`.

Minimum useful reconciliation (one script, no rewrite):

```python
import pandas as pd
rank = pd.read_parquet("artifacts/candidate_features.parquet")
eda  = pd.read_csv("../Datasets/candidate_features.csv")

# join saved_by_recruiters_30d (EDA) onto ranking features
merged = rank.merge(
    eda[["candidate_id", "saved_by_recruiters_30d"]],
    on="candidate_id", how="left"
)

# Spearman of ranking features vs recruiter-save proxy
numeric_rank_cols = [
    "evid_strong_ir", "evid_med_ml", "evid_eval", "applied_ml_years",
    "product_ratio", "avail_modifier", "semantic_fit", "yoe"
]
print(merged[numeric_rank_cols + ["saved_by_recruiters_30d"]]
      .corr(method="spearman")["saved_by_recruiters_30d"]
      .drop("saved_by_recruiters_30d")
      .sort_values(key=abs, ascending=False))
```

This does not require any schema change to either table — just a join.
It would show whether the ranker's chosen features actually predict the
only observable recruiter-behaviour signal in the dataset.

---

## Summary Table

| Question | Finding |
|---|---|
| EDA table | `Datasets/candidate_features.csv`, 34 cols, from `_featurize_tmp.py` |
| Ranking table | `artifacts/candidate_features.parquet`, 98 cols, from `src/features.py` |
| Shared columns | 13 exact-name matches (13% of ranking, 38% of EDA) |
| EDA-only | 21 columns — include 55% of EDA quality score weight |
| Ranking-only | 85 columns — include 100% of scoring inputs to `rank.py` |
| Divergence cause | Two scripts written for different purposes; never reconciled |
| Ranking features in EDA | None of the S_fit pillars exist in the EDA table |
| Invalid EDA conclusions | Quality score, tier banding, top-10 indicators, PCA latent factor |
| Valid EDA conclusions | Sentinel rates, distributions of 12 shared signals |
| Source of truth | `artifacts/candidate_features.parquet` — unambiguously |
| Blocks submission? | **No** — EDA is off the critical path |
| Recommended action | One-time join script to compute Spearman of ranking features vs. `saved_by_recruiters_30d`; no schema changes to either table |
