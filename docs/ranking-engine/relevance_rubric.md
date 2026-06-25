# Relevance Rubric — Senior AI Engineer (Founding Team), Redrob AI
**Phase 1 deliverable: the candidate evaluation framework that drives retrieval + ranking.**
Source: `job_description.docx`. Target eval: tiers 0–5, composite `0.50·NDCG@10 + 0.30·NDCG@50 + 0.15·MAP + 0.05·P@10`.
Weights below are *provisional* — calibrated by ablation on the hand-labeled gold set in Phase 4.

---

## 1. Must-have requirements (the role floor)
Stated under "Things you absolutely need" + the implicit "ideal candidate" floor. Absence of ALL of these caps a candidate low.

| # | Must-have | JD basis |
|---|-----------|----------|
| M1 | **Production embeddings-based retrieval** deployed to real users (drift, index refresh, retrieval-quality regression) | "Things you absolutely need" #1 |
| M2 | **Vector DB / hybrid-search infra** in production (Pinecone/Weaviate/Qdrant/Milvus/OpenSearch/Elasticsearch/FAISS) | #2 |
| M3 | **Strong Python** / real code quality | #3 |
| M4 | **Ranking-evaluation rigor** (NDCG/MRR/MAP, offline↔online correlation, A/B tests) | #4 |
| M5 | **Applied ML/AI at a PRODUCT company**, ≥1 end-to-end ranking/search/recommendation system shipped at meaningful scale | "How to read between the lines" |
| M6 | **Production deployment** (not research-only) | disqualifier #1 |
| M7 | **Currently writing code** (coded in last ~18 months) | disqualifier #3 |

> Key nuance: M1–M4 need **evidence in career-history descriptions/summary**, *not* skill-tag presence. A skill tag "FAISS" with no corroborating role description is treated as unverified (keyword-stuffer guard).

## 2. Strong positive signals (push toward Tier 4–5)
- Current/historical **title** = ML / AI / Applied Scientist / Search / RecSys / NLP / IR / Ranking engineer.
- Career descriptions explicitly **building/deploying** retrieval, ranking, search, recommendation, embeddings, RAG, vector search.
- **Pre-LLM-era ML** (≈ pre-2021): "understood retrieval and ranking before it became fashionable."
- **NLP / IR** domain depth.
- Shipped **to real users at scale** (large `company_size`, "production", "at scale", traffic/volume numbers).
- **Product-company career** (not services).
- **Behavioral availability**: recently active, high `recruiter_response_rate`, `open_to_work`, high `interview_completion_rate`, notice ≤30 days.
- **Location fit**: Pune / Noida (also Hyderabad / Mumbai / Delhi NCR) or `willing_to_relocate` within India.
- **Stable tenure** (anti title-chaser; plans to stay 3+ yrs).
- **External validation**: GitHub activity, open-source, papers/talks, certifications.

## 3. Nice-to-have signals ("won't reject you for")
- LLM fine-tuning (LoRA / QLoRA / PEFT).
- Learning-to-rank models (XGBoost-based or neural).
- HR-tech / recruiting-tech / marketplace product exposure.
- Distributed systems / large-scale inference optimization.
- Open-source contributions in AI/ML.

These **add** to a fit score but never rescue a candidate failing the must-haves.

## 4. Hard disqualifiers (cap the tier regardless of fit score)
| Gate | Rule | Cap | JD basis |
|------|------|-----|----------|
| G0 **Honeypot** | Profile internally impossible (see §Honeypot checks) | **Tier 0** | spec §7 |
| G1 **Wrong-role keyword-stuffer** | Non-eng title (Marketing/HR/Sales/Accountant/Designer/Ops) + AI skills only as tags, no eng career evidence | **Tier 0–1** | "between the lines" |
| G2 **Services-only career** | Entire career at TCS/Infosys/Wipro/Accenture/Cognizant/Capgemini/Mindtree-type, no product stint | **Tier 1** | "do NOT want" |
| G3 **Research-only** | Academic/research roles, no production deployment | **Tier 1** | disqualifier #1 |
| G4 **Recent-LangChain-only** | AI evidence only <12 mo LangChain→OpenAI, no substantial prior ML | **Tier 2** | disqualifier #2 |
| G5 **Stale senior / no recent code** | Pure "architecture/tech-lead" >18 mo, no hands-on code | **Tier 2** | disqualifier #3 |
| G6 **Wrong domain** | CV / speech / robotics primary, no meaningful NLP/IR | **Tier 1–2** | "do NOT want" |
| G7 **Closed-only, no validation** | 5+ yrs closed-source proprietary, zero external validation | **soft −, cap Tier 3** | "do NOT want" |

Soft negatives (down-weight, not gate): framework-enthusiast pattern (LangChain tutorials/demos), chronic <1.5-yr job-hopping, currently-at-services-firm-but-prior-product-OK.

## 5. Hidden intent behind the JD (what it *means*, not says)
1. **Shipper > researcher.** Tilt toward "ships a working ranker in a week," deep ML depth *and* scrappy product instinct in one person.
2. **The skills section is a decoy.** Real fit lives in career-history *descriptions* and *titles*, not the skills array. A "plain-language Tier 5" never writes "RAG" but built a recsys at a product company.
3. **Availability = hireability.** Perfect-on-paper but inactive/unresponsive ⇒ effectively not hireable ⇒ down-weight.
4. **Anti-hype / depth-over-recency.** Values people who did retrieval/ranking *before* it was fashionable; penalizes pure recent-LLM-wrapper résumés.
5. **Precision over recall.** "10 great matches > 1000 maybes" — directly mirrors the NDCG@10-heavy metric. Be conservative at the head; don't pad the top with maybes.
6. **Geographic + retention intent.** India (Pune/Noida) + intends to stay 3+ yrs.
7. **Generic "candidate quality" ≠ relevance here.** Recruiter-demand popularity (`saved_by_recruiters`, `search_appearance`) measures platform attractiveness, **not** fit to *this* JD — deliberately excluded from fit scoring (used only weakly as activity).

## 6. Tier definitions (0–5)
Calibrated so **Tier 5 is rare** (JD expects few) and **Tier 3+ = "relevant"** (P@10 boundary).

- **Tier 5 — Ideal / between-the-lines fit.** 6–8 yrs total, ~4–5 in applied ML/AI at *product* companies; shipped ≥1 end-to-end ranking/search/recsys at scale; clear retrieval **and** evaluation evidence; NLP/IR depth; pre-LLM ML roots; active + available; location/relocate fit; stable tenure; external validation. Passes all gates. **No buzzword requirement.**
- **Tier 4 — Strong, minor gaps.** Right domain and shipped systems, but one soft miss: slightly outside 5–9 band, notice >30, location needs relocation, currently at a services firm *with* prior product experience, or thinner eval-framework evidence.
- **Tier 3 — Relevant with clear gaps (lowest "relevant").** Adjacent: strong ML/data engineer transitioning into ML; has retrieval **or** ranking but not at scale; limited eval rigor; moderate availability. The CAND_0000001 "backend/data, building ML competence" archetype.
- **Tier 2 — Marginal.** Some ML exposure but wrong primary focus; recent-LLM-only with thin prior ML; framework-enthusiast; or low availability dragging an okay profile down. Not hireable for *this* role.
- **Tier 1 — Poor fit.** Wrong domain (CV/speech/robotics-only), services-only career, or research-only. Keyword-stuffers whose tags aren't corroborated by experience.
- **Tier 0 — Disqualified.** Honeypots (forced) and wrong-role keyword-stuffers (Marketing Manager with a perfect AI skill list). Also anyone tripping a hard gate with zero redeeming evidence.

## 7. Feature extraction map (requirement → schema field → method)
Extraction method legend: **KW**=keyword/regex over text, **SEM**=embedding similarity, **DICT**=lookup dictionary, **DATE**=date arithmetic, **NUM**=numeric signal.

| Requirement | Features to extract | Source field(s) | Method |
|---|---|---|---|
| M1 retrieval / M2 vector-DB | hits for embeddings/sentence-transformers/BGE/E5/RAG/vector-search + Pinecone/Weaviate/Qdrant/Milvus/OpenSearch/Elasticsearch/FAISS; **only counted if in role description, not just skills tag** | `career_history[].description`, `profile.summary`, `skills[].name` | KW + SEM + corroboration check |
| M3 Python depth | python signal strength; backend/eng titles | `skills[]`, titles, descriptions | KW + DICT |
| M4 eval rigor | NDCG/MRR/MAP/recall@k/A-B test/offline-online | descriptions, summary | KW |
| M5 shipped system @ scale | build/ship/deploy + ranking/search/recsys/recommendation; scale words; large `company_size` | descriptions; `career_history[].company_size` | KW + SEM + NUM |
| Role/title fit | classify each title → {core-ML, ML-adjacent, eng-other, non-eng} | `profile.current_title`, `career_history[].title` | DICT + KW |
| Experience band | `years_of_experience`; applied-ML years from ML-role durations | `profile.years_of_experience`, `career_history[] dates/title` | NUM + DATE |
| Product vs services | product-company ratio; services-firm flag | `current_company`, `career_history[].company` | DICT |
| Pre-LLM depth | ML evidence with `start_date` < ~2021; skill `duration_months` | career dates, `skills[].duration_months` | DATE + NUM |
| AI-recency / anti-LangChain-only | share of AI evidence that is recent-LLM-only vs longstanding ML | career dates, descriptions | DATE + KW |
| Domain (NLP/IR vs CV/speech) | domain keyword balance | descriptions, skills, `field_of_study` | KW |
| Location & relocation | city match to {Pune,Noida,Hyderabad,Mumbai,Delhi NCR}; relocate flag; India | `profile.location`, `country`, `willing_to_relocate` | DICT |
| Notice period | `notice_period_days` (≤30 ideal) | `redrob_signals.notice_period_days` | NUM |
| Tenure stability | avg job duration; count of <18-mo stints | `career_history[] dates`, `duration_months` | DATE + NUM |
| External validation | github score>0; certs; (papers/talks via KW) | `github_activity_score`, `certifications[]`, summary | NUM + KW |
| Behavioral availability | days since `last_active_date`; `recruiter_response_rate`; `open_to_work_flag`; `interview_completion_rate`; `avg_response_time_hours` | `redrob_signals.*` | DATE + NUM |
| Trust | `verified_email/phone`, `linkedin_connected`, `profile_completeness_score` | `redrob_signals.*` | NUM |
| Honeypot consistency | impossible-tenure, expert@0-duration, YOE/date mismatch, tag-vs-evidence gap, dup detection | all | DATE + NUM + SEM |

## 8. Scoring framework
Two-layer design: an additive **fit score** (JD match), a multiplicative **availability modifier** (hireability), then **hard gates** that cap the tier, then threshold to tiers. All sub-scores normalized to [0,1].

### 8.1 Fit score (S_fit ∈ [0,1])
```
S_fit = 0.42·RoleDomain + 0.18·ExperienceProfile + 0.12·ProductPedigree
      + 0.08·PreLLMDepth + 0.08·LocationLogistics + 0.07·TenureStability
      + 0.05·TrustValidation
```
- **RoleDomain (0.42)** = blend of: title_fit (DICT), semantic_fit (SEM cosine of summary+descriptions vs JD-intent blob), shipped_systems_evidence (KW, corroborated), eval_rigor (KW). This is the dominant axis and the keyword-stuffer guard lives here (skills-only tags discounted ~70%).
- **ExperienceProfile (0.18)** = years_band (peak at 6–8, smooth falloff, near-0 below 2 / above 13) × applied_ml_years (target 4–5) × scale_signal.
- **ProductPedigree (0.12)** = product_company_ratio (services-heavy penalized) + external_validation.
- **PreLLMDepth (0.08)** = pre-2021 ML evidence + skill duration depth; anti-LangChain-only penalty.
- **LocationLogistics (0.08)** = location_fit (1.0 Pune/Noida, 0.8 other listed metros, 0.6 relocate-willing, low otherwise) + notice_period score (≤30→1, linear to 180).
- **TenureStability (0.07)** = avg-tenure score − job-hop penalty.
- **TrustValidation (0.05)** = verifications + completeness (tie-breaker scale).

### 8.2 Availability modifier (M_avail ∈ [0.50, 1.10])
```
M_avail = clip(0.50 + 0.25·activity_recency + 0.20·response_rate
                    + 0.10·open_to_work + 0.05·interview_completion, 0.50, 1.10)
S = S_fit · M_avail
```
Demotes perfect-on-paper-but-unavailable; can mildly *boost* (≤1.10) a highly active strong fit. Never zeroes (gates do that).

### 8.3 Hard gates (applied after S, cap the assigned tier)
Honeypot → Tier 0. G1 → ≤Tier 1. G2/G3 → ≤Tier 1. G4/G5 → ≤Tier 2. G6 → ≤Tier 2. G7 → ≤Tier 3. (Per §4.)

### 8.4 Honeypot / consistency checks (feed G0)
- Single job `duration_months` > `years_of_experience`·12 (+slack); or Σ tenures ≫ YOE·12.
- Earliest `start_date` implies experience before plausible career start vs `years_of_experience`.
- `end_date` < `start_date`; `is_current=true` with non-null `end_date`.
- Many skills at `expert`/`advanced` with `duration_months = 0`.
- High `skill_assessment_scores` on skills with 0 duration / not in any role.
- Tenure at a company exceeding its plausible age (when company-age derivable).
- Near-duplicate profiles ("behavioral twins") via embedding + field hashing.

### 8.5 Tier thresholds (provisional — calibrate on gold set)
| Tier | Condition (after gates) |
|------|--------------------------|
| 5 | S ≥ 0.80 **and** explicit shipped-system + retrieval/ranking evidence **and** all gates pass |
| 4 | 0.65 ≤ S < 0.80 |
| 3 | 0.50 ≤ S < 0.65 |
| 2 | 0.35 ≤ S < 0.50 |
| 1 | 0.20 ≤ S < 0.35 |
| 0 | S < 0.20 **or** G0 honeypot **or** gate-forced |

**Output mapping:** rank by (tier desc, S desc); `score` column = S (or tier+normalized-S) ensuring non-increasing; tie-break by S then `candidate_id` asc. Only the top 100 are emitted, but the head (top ~10/50) gets the verification pass since NDCG@10 carries 50% of the metric.

---
*Calibration note:* every weight, threshold, and keyword list here is a hypothesis to be validated by ablation against the Phase-4 hand-labeled gold set (~150–200 candidates, tiers 0–5). Lock values only after measuring NDCG@10/@50 lift per component.
