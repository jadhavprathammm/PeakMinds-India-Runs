// Per-stage input and output interfaces for the Resume Understanding Pipeline.
// Each stage function takes its declared input type and returns its output type.

import type {
  DocumentQuality,
  SourceFormat,
  DegreeLevel,
  ResumeQuality,
  EvidenceStrength,
  CareerConsistency,
  RiskLevel,
  SeniorityLevel,
  RoleFamily,
  CandidateArchetype,
  DomainPosture,
} from "./enums";

import type {
  RoleEntry,
  Project,
  Achievement,
  Publication,
  Certification,
  SpokenLanguage,
  OpenSourceContribution,
  CommunicationSignals,
  CareerPreferences,
  LeadershipSignals,
  OwnershipSignals,
  RiskSignals,
  CareerTrajectory,
} from "./sub-types";

import type { CandidateProfile } from "./candidate-profile-v2";

// ── Stage 0 — Pre-flight ──────────────────────────────────────────────────────

export interface PreflightInput {
  raw_text: string;
  source_format: SourceFormat;
  ocr_confidence?: number;
  page_count?: number;
  char_count: number;
}

export interface QualitySignals {
  letter_ratio: number;
  avg_line_length: number;
  has_structured_sections: boolean;
  estimated_reading_time_minutes: number;
  encoding_issues_detected: boolean;
  ocr_artefacts_detected: boolean;
}

export interface PreflightOutput {
  normalized_text: string;
  char_count: number;
  word_count: number;
  line_count: number;
  detected_language: string;
  language_confidence: number;
  document_quality: DocumentQuality;
  quality_signals: QualitySignals;
  normalization_log: string[];
}

// ── Stage 1 — Section Detection ───────────────────────────────────────────────

export interface SectionMap {
  header: string | null;
  objective_summary: string | null;
  experience: string | null;
  skills: string | null;
  projects: string | null;
  education: string | null;
  publications: string | null;
  awards: string | null;
  languages: string | null;
  other: string[];
}

export interface SectionDetectionOutput {
  section_map: SectionMap;
  detected_section_count: number;
  missing_critical_sections: string[];
  section_confidence: number;
}

// ── Stage 2 — Identity ────────────────────────────────────────────────────────

export interface FieldConfidence {
  candidate_name: number;
  current_title: number;
  current_company: number;
  years_experience: number;
  location: number;
  contact_email: number;
}

export interface IdentityOutput {
  candidate_name: string | null;
  current_title: string | null;
  current_company: string | null;
  years_experience: number | null;
  location: string | null;
  contact_email: string | null;
  spoken_languages_raw: string | null;
  stage_confidence: number;
  field_confidence: FieldConfidence;
  extraction_warnings: string[];
}

// ── Stage 3 — Skills ──────────────────────────────────────────────────────────

export interface UncertainSkill {
  skill: string;
  likely_category: string;
}

export interface SkillsOutput {
  technical_skills: string[];
  tools: string[];
  frameworks: string[];
  cloud_platforms: string[];
  databases: string[];
  domain_keywords: string[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 4 — Experience ──────────────────────────────────────────────────────

export interface ExperienceOutput {
  role_history: RoleEntry[];
  total_ml_months: number;
  has_management_experience: boolean;
  leadership_signals: LeadershipSignals;
  ownership_signals: OwnershipSignals;
  computed_yoe: number | null;
  stage_confidence: number;
  date_parse_failures: number;
  extraction_warnings: string[];
}

// ── Stage 5 — Projects ────────────────────────────────────────────────────────

export interface ProjectsOutput {
  projects: Project[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 6 — Education ───────────────────────────────────────────────────────

export interface EducationOutput {
  highest_degree: DegreeLevel | null;
  field_of_study: string | null;
  institution: string | null;
  graduation_year: number | null;
  has_ml_related_degree: boolean;
  certifications: Certification[];
  spoken_languages: SpokenLanguage[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 7 — Evidence ────────────────────────────────────────────────────────

export interface EvidenceOutput {
  quantified_achievements: Achievement[];
  production_deployments: string[];
  open_source_contributions: OpenSourceContribution[];
  awards_and_recognition: string[];
  publications: Publication[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 8 — Communication ───────────────────────────────────────────────────

export interface CommunicationOutput {
  communication_signals: CommunicationSignals;
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 9 — Career Preferences ─────────────────────────────────────────────

export interface PreferencesOutput {
  career_preferences: CareerPreferences;
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 10 — Quality Signals ────────────────────────────────────────────────

export interface QualityOutput {
  resume_quality: ResumeQuality;
  evidence_strength: EvidenceStrength;
  career_consistency: CareerConsistency;
  extraction_confidence: number;
  parsing_warnings: string[];
}

// ── Stage 11 — Risk Analysis ──────────────────────────────────────────────────

export interface RiskOutput {
  risk_signals: RiskSignals;
  extraction_warnings: string[];
}

// ── Stage 12 — Recruiter Signals ──────────────────────────────────────────────

export interface RecruiterSignalsOutput {
  seniority_level: SeniorityLevel;
  primary_role_family: RoleFamily;
  secondary_role_families: RoleFamily[];
  role_family_confidence: number;
  specializations: string[];
  is_career_changer: boolean;
  has_pre_llm_depth: boolean;
  career_trajectory: CareerTrajectory;
  domain_posture: DomainPosture;
  profile_completeness: number;
  extraction_warnings: string[];
}

// ── Stage 13 — Archetype ──────────────────────────────────────────────────────

export interface ArchetypeSummarySignals {
  years_experience: number;
  total_ml_months: number;
  seniority_level: string;
  primary_role_family: string;
  secondary_role_families: string[];
  specializations: string[];
  has_pre_llm_depth: boolean;
  ownership_signals: OwnershipSignals;
  leadership_signals: LeadershipSignals;
  production_deployments_count: number;
  quantified_achievements_count: number;
  publication_count: number;
  communication_tier: string;
  career_trajectory_direction: string;
  domain_posture: string;
  top_frameworks: string[];
  top_domain_keywords: string[];
  projects_production_count: number;
  overall_risk_level: string;
}

export interface ArchetypeOutput {
  primary_archetype: CandidateArchetype;
  secondary_archetype: CandidateArchetype | null;
  confidence: number;
  evidence_summary: string;
  archetype_strengths: string[];
  archetype_watch_areas: string[];
  key_differentiators: string[];
  stage_confidence: number;
  extraction_warnings: string[];
}

// ── Stage 14 — Assembly ───────────────────────────────────────────────────────

export interface AssemblyOutput {
  profile: CandidateProfile;
  assembly_warnings: string[];
}

// ── Stage 15 — Validation ─────────────────────────────────────────────────────

export interface ValidationOutput {
  profile: CandidateProfile;
  is_valid: boolean;
  validation_errors: number;
  auto_corrections: string[];
}

// ── Aggregate: all stage outputs in pipeline order ────────────────────────────

export interface AllStageOutputs {
  preflight: PreflightOutput;
  sections: SectionDetectionOutput;
  identity: IdentityOutput;
  skills: SkillsOutput;
  experience: ExperienceOutput;
  projects: ProjectsOutput;
  education: EducationOutput;
  evidence: EvidenceOutput;
  communication: CommunicationOutput;
  preferences: PreferencesOutput;
  quality: QualityOutput;
  risk: RiskOutput;
  recruiter: RecruiterSignalsOutput;
  archetype: ArchetypeOutput;
}
