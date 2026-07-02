# Candidate-v2 Evaluation Plan

## Overview

This document defines 12 representative evaluation scenarios covering the full spectrum of candidate profiles. Each scenario specifies resume characteristics and expected pipeline outputs for validation and demonstration.

---

## TypeScript Interface

```ts
interface EvaluationScenario {
  id: string;
  title: string;
  description: string;
  resumeText: string; // Raw resume text for pipeline input

  expected: {
    archetype?: string;
    riskLevel?: string;
    primaryRisk?: string;
    strengths?: string[];
    weaknesses?: string[];
    // Detailed field expectations
    seniorityLevel?: string;
    primaryRoleFamily?: string;
    careerTrajectoryDirection?: string;
    domainPosture?: string;
    profileCompleteness?: number;
    extractionConfidence?: number;
    resumeQuality?: string;
    evidenceStrength?: string;
    careerConsistency?: string;
    communicationTier?: string;
  };
}
```

---

## 12 Evaluation Scenarios

### 1. Strong Senior Engineer

**ID:** `strong-senior-engineer`

**Description:** 12+ years at top tech companies with clear progression to principal level, strong production metrics, and communication signals.

**Resume Characteristics:**
- 12 years experience
- 5 roles: Google (Staff), Meta (Senior), Amazon (SDE2), startup (SDE), internship
- Clear progression: SDE → Senior → Staff → Principal
- 4 production deployments with metrics (latency -40%, throughput 3x, cost -$200K/yr)
- 3 quantified achievements with specific numbers
- Technical blog with 50+ posts, 3 conference presentations
- Mentored 10+ engineers, led cross-functional projects

**Expected Recruiter Signals:**
- `seniority_level`: "principal" or "staff"
- `primary_role_family`: "software_engineering"
- `career_trajectory_direction`: "ascending"
- `domain_posture`: "balanced" or "specialist"
- `profile_completeness`: > 85%

**Expected Archetype:** `builder` or `leader`

**Expected Risk Signals:**
- `overall_risk_level`: "low"
- `job_hopping_risk`: "none" or "low"
- `evidence_gap_risk`: "none"
- `extraction_risk`: "none"
- `primary_risk_factor`: "none"

**Expected Strengths:**
- Deep production experience with measurable impact
- Clear career progression
- Strong communication signals
- Broad + deep technical skills

**Expected Weaknesses:**
- May appear overqualified for IC roles
- High compensation expectations

---

### 2. Strong ML Engineer

**ID:** `strong-ml-engineer`

**Description:** 8 years ML-focused with production deployments, model improvements, and MLOps experience.

**Resume Characteristics:**
- 8 years experience
- 4 ML roles: ML Engineer at 3 companies, 1 Data Science
- 3 production ML deployments (model serving, feature store, pipeline)
- 4 quantified achievements (accuracy +5%, latency -60%, cost -30%, throughput 2x)
- 2 publications at NeurIPS/ICML
- Open source contributor to HuggingFace/transformers
- Strong MLOps: Kubeflow, MLflow, Airflow
- Pre-2020 ML experience (has_previous ML experience)

**Expected Recruiter Signals:**
- `seniority_level`: "senior" or "staff"
- `primary_role_family`: "ml_engineering"
- `specializations`: ["llm", "mlops", "recsys"] or similar
- `domain_posture`: "specialist"
- `has_pre_llm_depth`: true

**Expected Archetype:** `builder` or `operator`

**Expected Risk Signals:**
- `overall_risk_level`: "low"
- `evidence_gap_risk`: "none"
- `specialization_fragility_risk`: "low"
- `primary_risk_factor`: "none"

**Expected Strengths:**
- End-to-end ML production experience
- Quantified model improvements
- Modern framework proficiency
- Strong evidence trail

**Expected Weaknesses:**
- Narrower SWE breadth vs pure software engineers
- May lack distributed systems depth

---

### 3. Junior Fresher

**ID:** `junior-fresher`

**Description:** Recent graduate with internships, strong academic projects, and GitHub portfolio.

**Resume Characteristics:**
- 1 year experience (1 internship + capstone)
- BS Computer Science from top university
- 3 personal projects with GitHub links (1 production-grade)
- 2 quantified achievements (academic metrics)
- 1 conference presentation (student)
- Strong skills: Python, React, PostgreSQL, AWS
- No full-time professional experience

**Expected Recruiter Signals:**
- `seniority_level`: "intern" or "junior"
- `primary_role_family`: "software_engineering" or "data_science"
- `career_trajectory_direction`: "lateral"
- `profile_completeness`: 50-65%

**Expected Archetype:** `generalist` or `transitioner`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate" (fragility + evidence gap)
- `job_hopping_risk`: "none"
- `evidence_gap_risk`: "low" or "moderate"
- `specialization_fragility_risk`: "moderate" or "high"
- `primary_risk_factor`: "specialization_fragility_risk" or "evidence_gap_risk"

**Expected Strengths:**
- Strong academic foundation
- Demonstrated project work
- Clean parsing (high extraction confidence)

**Expected Weaknesses:**
- Limited professional evidence
- Narrow signal base
- No production experience

---

### 4. Career Switcher

**ID:** `career-switcher`

**Description:** 6 years SWE transitioning to ML, with self-study projects and 1 ML internship.

**Resume Characteristics:**
- 6 years total: 5 SWE + 1 ML internship
- SWE roles at mid-size companies (full-stack, backend)
- 3 ML projects (personal + bootcamp) with GitHub
- 1 ML internship with production deployment
- Clear narrative: "transitioning to ML"
- Skills: React, Node, Python, PyTorch, SQL
- No formal ML education (self-taught + bootcamp)

**Expected Recruiter Signals:**
- `seniority_level`: "mid" or "senior"
- `primary_role_family`: "ml_engineering" or "software_engineering"
- `is_career_changer`: true
- `specializations`: ["llm", "mlops"] or similar
- `career_trajectory_direction`: "pivoting"

**Expected Archetype:** `transitioner`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate"
- `job_hopping_risk`: "low"
- `evidence_gap_risk`: "moderate" (ML evidence thin)
- `specialization_fragility_risk`: "moderate"
- `primary_risk_factor`: "evidence_gap_risk" or "specialization_fragility_risk"

**Expected Strengths:**
- Strong SWE foundation
- Clear transition narrative
- Production deployment experience (from SWE)

**Expected Weaknesses:**
- Limited ML professional experience
- Evidence gap for ML claims
- May lack theoretical depth

---

### 5. Job Hopper

**ID:** `job-hopper`

**Description:** 8 years, 7 roles, average tenure 13 months, multiple sub-12-month stints.

**Resume Characteristics:**
- 8 years experience
- 7 roles across 7 companies
- Tenures: 6, 8, 14, 11, 9, 18, 12 months
- 3 consecutive short stints (<12 months)
- Mixed roles: SWE, Data Engineer, ML Engineer
- Some quantified achievements but inconsistent
- No role > 18 months

**Expected Recruiter Signals:**
- `seniority_level`: "mid" or "senior"
- `primary_role_family`: "software_engineering" or "unknown"
- `career_trajectory_direction`: "lateral" or "pivoting"
- `domain_posture`: "unfocused"

**Expected Archetype:** `transitioner` or `generalist`

**Expected Risk Signals:**
- `overall_risk_level`: "high" or "critical"
- `job_hopping_risk`: "high" or "critical"
- `employment_gap_risk`: "none" or "low"
- `evidence_gap_risk`: "moderate"
- `primary_risk_factor`: "job_hopping_risk"

**Expected Strengths:**
- Broad exposure to different stacks
- Adaptable
- Some achievements

**Expected Weaknesses:**
- Severe job hopping pattern
- Unfocused domain posture
- Retention risk

---

### 6. Long Employment Gap

**ID:** `long-employment-gap`

**Description:** Strong candidate with 24-month unexplained gap between roles.

**Resume Characteristics:**
- 10 years experience
- 4 roles at good companies
- 24-month gap after role 2 (2019-2021)
- No explanation in resume for gap
- Strong achievements before and after gap
- Current role 3 years, strong metrics
- Skills current (updated during gap)

**Expected Recruiter Signals:**
- `seniority_level`: "senior"
- `primary_role_family`: "software_engineering" or "ml_engineering"
- `career_trajectory_direction`: "lateral" (gap interrupts)
- `profile_completeness`: > 75%

**Expected Archetype:** `builder` or `operator`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate" or "high"
- `job_hopping_risk`: "low"
- `employment_gap_risk`: "high" or "critical"
- `evidence_gap_risk`: "low"
- `primary_risk_factor`: "employment_gap_risk"

**Expected Strengths:**
- Strong technical track record
- Current role stability
- Updated skills

**Expected Weaknesses:**
- Large unexplained gap
- Gap interrupts trajectory
- Recruiter will need explanation

---

### 7. Project Heavy Candidate

**ID:** `project-heavy`

**Description:** Moderate experience but 15+ projects with strong production signals, GitHub portfolio.

**Resume Characteristics:**
- 4 years experience
- 2 roles (2 years each)
- 18 projects: 8 personal, 6 academic, 4 work
- 10 production-grade projects with live URLs
- 12 quantified achievements across projects
- 5 open source contributions (2 maintainer)
- Strong GitHub profile (500+ stars total)
- Blog with 20 technical posts

**Expected Recruiter Signals:**
- `seniority_level`: "mid" or "senior"
- `primary_role_family`: "software_engineering" or "ml_engineering"
- `domain_posture`: "balanced" or "specialist"
- `communication_tier`: "strong" or "exceptional"

**Expected Archetype:** `builder`

**Expected Risk Signals:**
- `overall_risk_level`: "low"
- `job_hopping_risk`: "low"
- `evidence_gap_risk`: "none"
- `specialization_fragility_risk`: "low"
- `primary_risk_factor`: "none"

**Expected Strengths:**
- Exceptional evidence density
- Production-grade projects
- Strong communication signals
- Self-driven learner

**Expected Weaknesses:**
- Fewer professional roles
- May lack team/leadership experience

---

### 8. Experience Heavy Candidate

**ID:** `experience-heavy`

**Description:** 15 years, 6 roles, deep expertise but minimal projects/evidence section.

**Resume Characteristics:**
- 15 years experience
- 6 roles at enterprise companies (IBM, Oracle, etc.)
- 3 roles > 3 years each
- Strong leadership: managed 20+ engineers, budgets
- 2 quantified achievements (team metrics)
- No projects section
- No GitHub, no blog
- Limited technical detail in descriptions
- Skills listed but not demonstrated

**Expected Recruiter Signals:**
- `seniority_level`: "staff" or "principal"
- `primary_role_family`: "management" or "software_engineering"
- `has_management_experience`: true
- `leadership_signals.managed_teams`: true
- `communication_tier`: "moderate" (resume only)

**Expected Archetype:** `leader` or `generalist`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate"
- `job_hopping_risk`: "none"
- `evidence_gap_risk`: "high" or "critical"
- `specialization_fragility_risk`: "moderate"
- `primary_risk_factor`: "evidence_gap_risk"

**Expected Strengths:**
- Deep leadership experience
- Stable employment
- Enterprise scale experience

**Expected Weaknesses:**
- Evidence gap (claims vs proof)
- No portfolio
- Skills not demonstrated
- May be overqualified for IC

---

### 9. Weak Resume

**ID:** `weak-resume`

**Description:** Sparse content, few details, minimal sections, low information density.

**Resume Characteristics:**
- 3 years experience
- 2 roles, 1.5 years each
- 50 words total in experience section
- No quantified achievements
- Skills: "Python, JavaScript, SQL" (no detail)
- No projects, no publications, no awards
- No education details
- Generic descriptions: "worked on backend", "fixed bugs"

**Expected Recruiter Signals:**
- `seniority_level`: "junior" or "mid"
- `primary_role_family`: "unknown" or "software_engineering"
- `profile_completeness`: < 40%
- `extraction_confidence`: < 0.4

**Expected Archetype:** `generalist`

**Expected Risk Signals:**
- `overall_risk_level`: "high"
- `job_hopping_risk`: "low"
- `evidence_gap_risk`: "critical"
- `specialization_fragility_risk`: "critical"
- `extraction_risk`: "high" or "critical"
- `primary_risk_factor`: "evidence_gap_risk" or "specialization_fragility_risk"

**Expected Strengths:**
- Some experience

**Expected Weaknesses:**
- Extremely sparse
- No evidence
- Unparseable sections
- No differentiators

---

### 10. Poorly Formatted Resume

**ID:** `poorly-formatted`

**Description:** Good candidate but resume has OCR artifacts, weird formatting, missing sections.

**Resume Characteristics:**
- 6 years experience (good content underneath)
- PDF with 2-column layout (OCR scrambles)
- Tables for skills (parsed poorly)
- Special characters, encoding issues
- Sections merged: experience+projects together
- Headers not detected
- 30% OCR error rate

**Expected Recruiter Signals:**
- `seniority_level`: "mid" or "senior" (if extracted)
- `profile_completeness`: variable
- `extraction_confidence`: < 0.5
- `parsing_warnings`: many (OCR_ARTIFACTS, SECTION_MERGE, etc.)

**Expected Archetype:** variable (depends on extraction)

**Expected Risk Signals:**
- `overall_risk_level`: "moderate" or "high"
- `extraction_risk`: "high" or "critical"
- `evidence_gap_risk`: "high" (artificially inflated by poor extraction)
- `primary_risk_factor`: "extraction_risk" (but should not affect overall)

**Expected Strengths:**
- Actual experience may be strong

**Expected Weaknesses:**
- Poor parsing reliability
- Artificially inflated risks
- Missing sections
- Low confidence outputs

---

### 11. Overqualified Candidate

**ID:** `overqualified`

**Description:** 20 years experience applying for senior IC role, held VP/CTO titles.

**Resume Characteristics:**
- 20 years experience
- Last 3 roles: VP Engineering, CTO, Director
- 50+ engineers managed
- Strategic leadership, not hands-on
- 2 quantified achievements (org metrics)
- No recent production code
- Skills: architecture, strategy, hiring
- Clear applying down

**Expected Recruiter Signals:**
- `seniority_level`: "principal" or "unknown"
- `primary_role_family`: "management"
- `has_management_experience`: true
- `career_trajectory_direction`: "descending" (if applying down)
- `overqualification_risk`: "high" or "critical"

**Expected Archetype:** `leader` or `founder`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate" or "high"
- `overqualification_risk`: "high" or "critical"
- `job_hopping_risk`: "low" (stable at top)
- `evidence_gap_risk`: "moderate" (no recent IC evidence)
- `primary_risk_factor`: "overqualification_risk"

**Expected Strengths:**
- Exceptional leadership
- Strategic vision
- Hiring/scaling experience

**Expected Weaknesses:**
- Not hands-on recently
- Retention risk
- Compensation mismatch
- IC skill decay

---

### 12. Underqualified Candidate

**ID:** `underqualified`

**Description:** 5 years experience but claims senior/lead, no evidence of scope or impact.

**Resume Characteristics:**
- 5 years experience
- Title: "Senior Software Engineer" (self-given)
- 1 role, 5 years at same company
- No team leadership
- No architecture decisions
- No quantified achievements
- Skills list impressive but not demonstrated
- Descriptions: "wrote code", "fixed bugs", "attended meetings"
- No projects, no GitHub

**Expected Recruiter Signals:**
- `seniority_level`: "mid" (not senior)
- `primary_role_family`: "software_engineering"
- `leadership_signals.managed_teams`: false
- `ownership_signals`: all false
- `underqualification_risk`: "moderate" or "high"

**Expected Archetype:** `generalist`

**Expected Risk Signals:**
- `overall_risk_level`: "moderate" or "high"
- `job_hopping_risk`: "none"
- `evidence_gap_risk`: "high"
- `underqualification_risk`: "moderate" or "high"
- `specialization_fragility_risk`: "moderate"
- `primary_risk_factor`: "underqualification_risk" or "evidence_gap_risk"

**Expected Strengths:**
- Stable employment
- Some experience

**Expected Weaknesses:**
- Title inflation
- No demonstrated senior scope
- Evidence gap
- No ownership signals

---

## Automated Test Recommendations

### High Priority (Core Pipeline Validation)
| Scenario | Reason |
|----------|--------|
| `strong-senior-engineer` | Validates full pipeline on high-quality input; all stages should produce confident outputs |
| `strong-ml-engineer` | Validates ML-specific signals (specializations, ML months, evidence) |
| `junior-fresher` | Validates handling of sparse experience, career trajectory logic |
| `job-hopper` | Validates job hopping risk computation (critical risk path) |
| `long-employment-gap` | Validates employment gap detection and risk scoring |
| `weak-resume` | Validates graceful degradation, low confidence handling |
| `poorly-formatted` | Validates OCR/parsing resilience, extraction risk isolation |

### Medium Priority (Signal Quality)
| Scenario | Reason |
|----------|--------|
| `career-switcher` | Validates career changer detection, pivot logic |
| `project-heavy` | Validates project evidence aggregation, communication signals |
| `experience-heavy` | Validates evidence gap risk with high experience |
| `underqualified` | Validates title vs evidence mismatch detection |

### Low Priority (Edge Cases)
| Scenario | Reason |
|----------|--------|
| `overqualified` | Validates overqualification risk (less common) |

---

## Demo Resume Recommendations

### Primary Demo Set (3-4 resumes for judging)
1. **`strong-senior-engineer`** — Showcases pipeline at its best; all green signals
2. **`strong-ml-engineer`** — Demonstrates ML-specific intelligence (specializations, pre-LLM depth, MLOps)
3. **`career-switcher`** — Shows nuanced understanding: pivot detection, transitioner archetype
4. **`job-hopper`** — Demonstrates risk system working (red flags explained, not just scored)

### Secondary Demo Set (if time permits)
5. **`project-heavy`** — Impressive evidence density, builder archetype
6. **`long-employment-gap`** — Shows gap detection with human-readable reasoning

### Anti-Demo (What Not to Show)
- `weak-resume` — Pipeline handles it but not impressive
- `poorly-formatted` — Shows parsing limits, not intelligence
- `overqualified` / `underqualified` — Edge cases

---

## Validation Checklist per Scenario

When running evaluation, verify:

- [ ] Pipeline completes without throwing
- [ ] `extraction_confidence` in expected range
- [ ] `seniority_level` matches expectation ±1 level
- [ ] `primary_role_family` matches expectation
- [ ] `archetype` matches expectation
- [ ] `overall_risk_level` matches expectation
- [ ] `primary_risk_factor` matches expectation
- [ ] Risk detail strings are human-readable and specific
- [ ] `profile_completeness` in expected range
- [ ] `communication_tier` matches evidence
- [ ] No `extraction_risk` contributing to `overall_risk_level`
- [ ] Stage confidences reasonable (>0.3 for good inputs)
- [ ] No critical validation errors in final output

---

## Running Evaluations

```bash
# From apps/web directory
npm run evaluate -- --scenario=strong-senior-engineer
npm run evaluate -- --all
npm run evaluate -- --demo  # Runs primary demo set
```

The evaluation runner should:
1. Load scenario resume text
2. Run `runUnderstandingPipeline()`
3. Compare output profile against `expected` fields
4. Generate pass/fail report with diffs
5. Output summary table for all scenarios