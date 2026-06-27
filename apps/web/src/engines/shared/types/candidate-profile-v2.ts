// CandidateProfile V2 — FROZEN. Do not add or remove fields.
// See docs/resume-understanding-engine.md for the field ownership map.

import type {
  DegreeLevel,
  SeniorityLevel,
  RoleFamily,
  CandidateArchetype,
  ResumeQuality,
  EvidenceStrength,
  CareerConsistency,
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

export interface CandidateProfile {
  // Section 1 — Identity (owned by Stage 2)
  candidate_name: string | null;
  current_title: string | null;
  current_company: string | null;
  years_experience: number;
  location: string | null;
  contact_email: string | null;

  // Section 2 — Skills (owned by Stage 3)
  technical_skills: string[];
  tools: string[];
  frameworks: string[];
  cloud_platforms: string[];
  databases: string[];
  domain_keywords: string[];

  // Section 3 — Experience (owned by Stage 4)
  role_history: RoleEntry[];
  total_ml_months: number;
  has_management_experience: boolean;
  leadership_signals: LeadershipSignals;
  ownership_signals: OwnershipSignals;

  // Section 4 — Education (owned by Stage 6)
  highest_degree: DegreeLevel | null;
  field_of_study: string | null;
  institution: string | null;
  graduation_year: number | null;
  has_ml_related_degree: boolean;
  certifications: Certification[];
  spoken_languages: SpokenLanguage[];

  // Section 5 — Evidence (owned by Stage 7)
  quantified_achievements: Achievement[];
  production_deployments: string[];
  open_source_contributions: OpenSourceContribution[];
  awards_and_recognition: string[];
  publications: Publication[];

  // Section 6 — Quality Signals (owned by Stage 10)
  resume_quality: ResumeQuality;
  evidence_strength: EvidenceStrength;
  career_consistency: CareerConsistency;
  extraction_confidence: number;
  parsing_warnings: string[];

  // Section 7 — Recruiter Signals (owned by Stage 12)
  seniority_level: SeniorityLevel;
  primary_role_family: RoleFamily;
  secondary_role_families: RoleFamily[];
  role_family: RoleFamily; // backward-compat alias for primary_role_family
  role_family_confidence: number;
  specializations: string[];
  is_career_changer: boolean;
  has_pre_llm_depth: boolean;
  career_trajectory: CareerTrajectory;
  domain_posture: DomainPosture;
  profile_completeness: number;

  // Section 8 — Career Preferences (owned by Stage 9)
  career_preferences: CareerPreferences;

  // Section 9 — Projects (owned by Stage 5)
  projects: Project[];

  // Section 10 — Communication Signals (owned by Stage 8)
  communication_signals: CommunicationSignals;

  // Section 11 — Risk Signals (owned by Stage 11)
  risk_signals: RiskSignals;

  // Section 12 — Archetype (owned by Stage 13)
  archetype: CandidateArchetype;
  key_differentiators: string[];
}
