// Resume Understanding Pipeline — orchestrator for all 16 stages.
// Entry point: runUnderstandingPipeline(input) → ValidationOutput.
//
// Pipeline invariants:
//   1. Never throws — all stage errors are caught and safe defaults applied.
//   2. Stage outputs are immutable — assembly reads them; does not re-run stages.
//   3. Warnings accumulate, never overwrite.
//   4. Claude is never given raw text in Stage 13.

import type { PreflightInput } from "@/engines/shared/types/stage-outputs";
import type { ValidationOutput } from "@/engines/shared/types/stage-outputs";
import type {
  PreflightOutput,
  SectionDetectionOutput,
  IdentityOutput,
  SkillsOutput,
  ExperienceOutput,
  ProjectsOutput,
  EducationOutput,
  EvidenceOutput,
  CommunicationOutput,
  PreferencesOutput,
  QualityOutput,
  RiskOutput,
  RecruiterSignalsOutput,
  ArchetypeOutput,
  AssemblyOutput,
} from "@/engines/shared/types/stage-outputs";
import type {
  ResumeQuality,
  EvidenceStrength,
  CareerConsistency,
  RiskLevel,
} from "@/engines/shared/types/enums";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { RiskSignals } from "@/engines/shared/types/sub-types";

import { runStage0Preflight, PreflightError } from "./stage-0-preflight";
import { runStage1Sections } from "./stage-1-sections";
import { runStage2Identity, IDENTITY_STAGE_DEFAULTS } from "./stage-2-identity";
import { runStage3Skills, SKILLS_STAGE_DEFAULTS } from "./stage-3-skills";
import { runStage4Experience, EXPERIENCE_STAGE_DEFAULTS } from "./stage-4-experience";
import { runStage5Projects, PROJECTS_STAGE_DEFAULTS } from "./stage-5-projects";
import { runStage6Education, EDUCATION_STAGE_DEFAULTS } from "./stage-6-education";
import { runStage7Evidence, EVIDENCE_STAGE_DEFAULTS } from "./stage-7-evidence";
import { runStage8Communication, COMMUNICATION_STAGE_DEFAULTS } from "./stage-8-communication";
import { runStage9Preferences, PREFERENCES_STAGE_DEFAULTS } from "./stage-9-preferences";
import { runStage10Quality } from "./stage-10-quality";
import { runStage11Risk } from "./stage-11-risk";
import { runStage12RecruiterSignals } from "./stage-12-recruiter-signals";
import { runStage13Archetype, ARCHETYPE_STAGE_DEFAULTS } from "./stage-13-archetype";
import { runStage14Assembly } from "./stage-14-assembly";
import { runStage15Validation } from "./stage-15-validation";

// Minimal fallback objects for stages without exported defaults
const QUALITY_STAGE_DEFAULTS: QualityOutput = {
  resume_quality: "sparse",
  evidence_strength: "anecdotal",
  career_consistency: "fragmented",
  extraction_confidence: 0.1,
  parsing_warnings: ["QUALITY_COMPUTATION_FAILED"],
};

const RISK_STAGE_DEFAULTS: RiskOutput = {
  risk_signals: {
    job_hopping_risk: "none",
    job_hopping_detail: null,
    evidence_gap_risk: "none",
    evidence_gap_detail: null,
    employment_gap_risk: "none",
    employment_gap_months: 0,
    specialization_fragility_risk: "none",
    extraction_risk: "critical",
    overqualification_risk: "none",
    underqualification_risk: "none",
    overall_risk_level: "critical",
    primary_risk_factor: "none",
    risk_flags: ["RISK_COMPUTATION_FAILED"],
  },
  extraction_warnings: ["RISK_COMPUTATION_FAILED"],
};

const RECRUITER_STAGE_DEFAULTS: RecruiterSignalsOutput = {
  seniority_level: "unknown",
  primary_role_family: "unknown",
  secondary_role_families: [],
  role_family_confidence: 0,
  specializations: [],
  is_career_changer: false,
  has_pre_llm_depth: false,
  career_trajectory: { direction: "lateral", velocity: "steady" },
  domain_posture: "unfocused",
  profile_completeness: 0,
  extraction_warnings: ["RECRUITER_SIGNALS_COMPUTATION_FAILED"],
};

// Run the full 16-stage understanding pipeline.
// Input: PreflightInput from the ingestion adapter.
// Output: ValidationOutput always — never throws.
//
// On PreflightError (unrecoverable document): returns a minimal profile
// with extraction_confidence = 0 and the error in parsing_warnings.
export async function runUnderstandingPipeline(
  input: PreflightInput,
): Promise<ValidationOutput> {
  // ── Stage 0: Pre-flight (may throw PreflightError → abort pipeline)
  let preflight: PreflightOutput;
  try {
    preflight = await runStage0Preflight(input);
  } catch (err) {
    if (err instanceof PreflightError) {
      return buildPreflightErrorOutput(err);
    }
    throw err;
  }

  // ── Stage 1: Section Detection
  const sections = await safeRun(() => runStage1Sections(preflight), {
    section_map: {
      header: null,
      objective_summary: null,
      experience: preflight.normalized_text,
      skills: null,
      projects: null,
      education: null,
      publications: null,
      awards: null,
      languages: null,
      other: [],
    },
    detected_section_count: 0,
    missing_critical_sections: ["experience", "skills"],
    section_confidence: 0.2,
  });

  // ── Stages 2–3: Parallel (no cross-dependencies)
  const [identity, skills] = await Promise.all([
    safeRun(() => runStage2Identity(sections, preflight.normalized_text), IDENTITY_STAGE_DEFAULTS),
    safeRun(() => runStage3Skills(sections), SKILLS_STAGE_DEFAULTS),
  ]);

  // ── Stage 4: Experience (must complete before Stage 5)
  const experience = await safeRun(
    () => runStage4Experience(sections, preflight.normalized_text),
    EXPERIENCE_STAGE_DEFAULTS,
  );

  // ── Stage 5: Projects (depends on Stage 4 output)
  const projects = await safeRun(
    () => runStage5Projects(sections, experience),
    PROJECTS_STAGE_DEFAULTS,
  );

  // ── Stage 6: Education (independent)
  const education = await safeRun(
    () => runStage6Education(sections),
    EDUCATION_STAGE_DEFAULTS,
  );

  // ── Stage 7: Evidence (depends on Stage 4 output)
  const evidence = await safeRun(
    () => runStage7Evidence(preflight, experience),
    EVIDENCE_STAGE_DEFAULTS,
  );

  // ── Stage 8: Communication (depends on Stage 7 output)
  const communication = await safeRun(
    () => runStage8Communication(preflight, evidence),
    COMMUNICATION_STAGE_DEFAULTS,
  );

  // ── Stage 9: Preferences (independent)
  const preferences = await safeRun(
    () => runStage9Preferences(sections, preflight),
    PREFERENCES_STAGE_DEFAULTS,
  );

  // ── Stage 10: Quality Signal Computation
  const stageConfidences: Record<string, number> = {
    identity: identity.stage_confidence,
    skills: skills.stage_confidence,
    experience: experience.stage_confidence,
    projects: projects.stage_confidence,
    education: education.stage_confidence,
    evidence: evidence.stage_confidence,
    communication: communication.stage_confidence,
    preferences: preferences.stage_confidence,
  };
  const allWarnings = [
    identity.extraction_warnings,
    skills.extraction_warnings,
    experience.extraction_warnings,
    projects.extraction_warnings,
    education.extraction_warnings,
    evidence.extraction_warnings,
    communication.extraction_warnings,
    preferences.extraction_warnings,
  ];
  const quality = await safeRun(
    () => runStage10Quality(preflight, sections, identity, skills, experience, evidence, stageConfidences, allWarnings),
    QUALITY_STAGE_DEFAULTS,
  );

  // ── Stage 11: Risk Analysis
  const risk = await safeRun(
    () => runStage11Risk(identity, experience, skills, projects, evidence, communication, quality),
    RISK_STAGE_DEFAULTS,
  );

  // ── Stage 12: Recruiter Signals
  const recruiter = await safeRun(
    () => runStage12RecruiterSignals(identity, experience, skills, evidence),
    RECRUITER_STAGE_DEFAULTS,
  );

  // ── Stage 13: Archetype Classification
  const archetype = await safeRun(
    () => runStage13Archetype(experience, skills, evidence, communication, recruiter, risk, projects),
    ARCHETYPE_STAGE_DEFAULTS,
  );

  // ── Stage 14: Assembly
  const assembly = await safeRun(
    () => runStage14Assembly({
      preflight,
      sections,
      identity,
      skills,
      experience,
      projects,
      education,
      evidence,
      communication,
      preferences,
      quality,
      risk,
      recruiter,
      archetype,
    }),
    {
      profile: buildMinimalProfile(),
      assembly_warnings: ["ASSEMBLY_FAILED"],
    },
  );

  // ── Stage 15: Validation
  return await safeRun(
    () => runStage15Validation(assembly),
    {
      profile: assembly.profile,
      is_valid: false,
      validation_errors: 1,
      auto_corrections: ["VALIDATION_FAILED_FALLBACK"],
    },
  );
}

// Safe execution with fallback — supports both sync and async functions.
async function safeRun<T>(fn: () => T | Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// Build a minimal ValidationOutput when Preflight fails.
function buildPreflightErrorOutput(err: PreflightError): ValidationOutput {
  const minimalProfile: CandidateProfile = {
    candidate_name: null,
    current_title: null,
    current_company: null,
    years_experience: 0,
    location: null,
    contact_email: null,
    technical_skills: [],
    tools: [],
    frameworks: [],
    cloud_platforms: [],
    databases: [],
    domain_keywords: [],
    role_history: [],
    total_ml_months: 0,
    has_management_experience: false,
    leadership_signals: {
      managed_teams: false,
      team_size_estimate: null,
      led_cross_functional_projects: false,
      mentored_juniors: false,
      presented_externally: false,
    },
    ownership_signals: {
      shipped_to_production: false,
      owned_full_pipeline: false,
      led_architecture_decisions: false,
      drove_measurable_outcomes: false,
    },
    highest_degree: null,
    field_of_study: null,
    institution: null,
    graduation_year: null,
    has_ml_related_degree: false,
    certifications: [],
    spoken_languages: [],
    quantified_achievements: [],
    production_deployments: [],
    open_source_contributions: [],
    awards_and_recognition: [],
    publications: [],
    resume_quality: "sparse",
    evidence_strength: "anecdotal",
    career_consistency: "fragmented",
    extraction_confidence: 0,
    parsing_warnings: [`PREFLIGHT_FAILED: ${err.code} - ${err.message}`],
    seniority_level: "unknown",
    primary_role_family: "unknown",
    secondary_role_families: [],
    role_family: "unknown",
    role_family_confidence: 0,
    specializations: [],
    is_career_changer: false,
    has_pre_llm_depth: false,
    career_trajectory: { direction: "lateral", velocity: "steady" },
    domain_posture: "unfocused",
    profile_completeness: 0,
    career_preferences: {
      desired_roles: [],
      preferred_domains: [],
      preferred_locations: [],
      relocation_willingness: "unknown",
      work_mode: "unknown",
      industry_preferences: [],
      employment_status: "unknown",
      open_to_work: false,
      expected_compensation: null,
      start_date_raw: null,
      work_auth_raw: null,
    },
    projects: [],
    communication_signals: {
      presentations: [],
      technical_writing: {
        has_technical_blog: false,
        blog_platform: null,
        blog_url: null,
        estimated_post_count: null,
        writing_topics: [],
      },
      mentoring: {
        formal_mentoring_role: false,
        junior_coaching_described: false,
        onboarding_described: false,
        mentees_count_estimate: null,
      },
      community: {
        open_source_maintainer: false,
        conference_organizer: false,
        community_names: [],
        stackoverflow_reputation_mentioned: false,
      },
      communication_tier: "minimal",
      publication_count: 0,
      communication_score: 0,
    },
    risk_signals: {
      job_hopping_risk: "none",
      job_hopping_detail: null,
      evidence_gap_risk: "none",
      evidence_gap_detail: null,
      employment_gap_risk: "none",
      employment_gap_months: 0,
      specialization_fragility_risk: "none",
      extraction_risk: "critical",
      overqualification_risk: "none",
      underqualification_risk: "none",
      overall_risk_level: "critical",
      primary_risk_factor: "none",
      risk_flags: ["PREFLIGHT_FAILED"],
    },
    archetype: "generalist",
    key_differentiators: [],
  };

  return {
    profile: minimalProfile,
    is_valid: false,
    validation_errors: 1,
    auto_corrections: [],
  };
}

function buildMinimalProfile(): CandidateProfile {
  return {
    candidate_name: null,
    current_title: null,
    current_company: null,
    years_experience: 0,
    location: null,
    contact_email: null,
    technical_skills: [],
    tools: [],
    frameworks: [],
    cloud_platforms: [],
    databases: [],
    domain_keywords: [],
    role_history: [],
    total_ml_months: 0,
    has_management_experience: false,
    leadership_signals: {
      managed_teams: false,
      team_size_estimate: null,
      led_cross_functional_projects: false,
      mentored_juniors: false,
      presented_externally: false,
    },
    ownership_signals: {
      shipped_to_production: false,
      owned_full_pipeline: false,
      led_architecture_decisions: false,
      drove_measurable_outcomes: false,
    },
    highest_degree: null,
    field_of_study: null,
    institution: null,
    graduation_year: null,
    has_ml_related_degree: false,
    certifications: [],
    spoken_languages: [],
    quantified_achievements: [],
    production_deployments: [],
    open_source_contributions: [],
    awards_and_recognition: [],
    publications: [],
    resume_quality: "sparse",
    evidence_strength: "anecdotal",
    career_consistency: "fragmented",
    extraction_confidence: 0.1,
    parsing_warnings: [],
    seniority_level: "unknown",
    primary_role_family: "unknown",
    secondary_role_families: [],
    role_family: "unknown",
    role_family_confidence: 0,
    specializations: [],
    is_career_changer: false,
    has_pre_llm_depth: false,
    career_trajectory: { direction: "lateral", velocity: "steady" },
    domain_posture: "unfocused",
    profile_completeness: 0,
    career_preferences: {
      desired_roles: [],
      preferred_domains: [],
      preferred_locations: [],
      relocation_willingness: "unknown",
      work_mode: "unknown",
      industry_preferences: [],
      employment_status: "unknown",
      open_to_work: false,
      expected_compensation: null,
      start_date_raw: null,
      work_auth_raw: null,
    },
    projects: [],
    communication_signals: {
      presentations: [],
      technical_writing: {
        has_technical_blog: false,
        blog_platform: null,
        blog_url: null,
        estimated_post_count: null,
        writing_topics: [],
      },
      mentoring: {
        formal_mentoring_role: false,
        junior_coaching_described: false,
        onboarding_described: false,
        mentees_count_estimate: null,
      },
      community: {
        open_source_maintainer: false,
        conference_organizer: false,
        community_names: [],
        stackoverflow_reputation_mentioned: false,
      },
      communication_tier: "minimal",
      publication_count: 0,
      communication_score: 0,
    },
risk_signals: {
      job_hopping_risk: "none",
      job_hopping_detail: null,
      evidence_gap_risk: "none",
      evidence_gap_detail: null,
      employment_gap_risk: "none",
      employment_gap_months: 0,
      specialization_fragility_risk: "none",
      extraction_risk: "low",
      overqualification_risk: "none",
      underqualification_risk: "none",
      overall_risk_level: "low",
      primary_risk_factor: "none",
      risk_flags: [],
    },
    archetype: "generalist",
    key_differentiators: [],
  };
}