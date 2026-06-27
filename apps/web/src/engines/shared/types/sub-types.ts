// Nested types used inside CandidateProfile V2.
// Imported by candidate-profile-v2.ts and stage-outputs.ts.

import type {
  RoleClass,
  ProjectComplexity,
  OwnershipLevel,
  ProjectSource,
  ProficiencyLevel,
  AudienceScope,
  CommunicationTier,
  RelocationWillingness,
  WorkModePreference,
  EmploymentStatus,
  RiskLevel,
  CareerDirection,
  CareerVelocity,
  ContributionType,
  CompensationPeriod,
} from "./enums";

// ── Experience ────────────────────────────────────────────────────────────────

export interface RoleEntry {
  title: string;
  company: string;
  start_date_raw: string | null;
  end_date_raw: string | null;
  start_year: number | null;
  start_month: number | null;
  end_year: number | null;
  end_month: number | null;
  is_current: boolean;
  duration_months: number;
  role_class: RoleClass;
  description: string;
  key_responsibilities: string[];
}

export interface LeadershipSignals {
  managed_teams: boolean;
  team_size_estimate: number | null;
  led_cross_functional_projects: boolean;
  mentored_juniors: boolean;
  presented_externally: boolean;
}

export interface OwnershipSignals {
  shipped_to_production: boolean;
  owned_full_pipeline: boolean;
  led_architecture_decisions: boolean;
  drove_measurable_outcomes: boolean;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  domain: string | null;
  impact: string | null;
  complexity: ProjectComplexity;
  production_grade: boolean;
  active_users_estimate: number | null;
  team_size: number | null;
  ownership_level: OwnershipLevel;
  start_year: number | null;
  end_year: number | null;
  is_ongoing: boolean;
  url: string | null;
  source: ProjectSource;
  source_company: string | null;
  source_role_index: number | null;
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export interface Achievement {
  claim: string;
  metric: string | null;
  domain: string | null;
  source_role_index: number | null;
}

export interface Publication {
  title: string;
  venue: string | null;
  year: number | null;
}

export interface OpenSourceContribution {
  project_name: string;
  contribution_type: ContributionType;
  url: string | null;
}

// ── Education ─────────────────────────────────────────────────────────────────

export interface Certification {
  name: string;
  issuer: string | null;
  year: number | null;
}

export interface SpokenLanguage {
  language: string;
  proficiency: ProficiencyLevel;
}

// ── Communication Signals ─────────────────────────────────────────────────────

export interface Presentation {
  title: string;
  event: string | null;
  year: number | null;
  audience_scope: AudienceScope;
  url: string | null;
}

export interface TechnicalWriting {
  has_technical_blog: boolean;
  blog_platform: string | null;
  blog_url: string | null;
  estimated_post_count: number | null;
  writing_topics: string[];
}

export interface MentoringSignals {
  formal_mentoring_role: boolean;
  junior_coaching_described: boolean;
  onboarding_described: boolean;
  mentees_count_estimate: number | null;
}

export interface CommunitySignals {
  open_source_maintainer: boolean;
  conference_organizer: boolean;
  community_names: string[];
  stackoverflow_reputation_mentioned: boolean;
}

export interface CommunicationSignals {
  presentations: Presentation[];
  technical_writing: TechnicalWriting;
  mentoring: MentoringSignals;
  community: CommunitySignals;
  communication_tier: CommunicationTier;
  publication_count: number;
}

// ── Career Preferences ────────────────────────────────────────────────────────

export interface CompensationExpectation {
  amount: number | null;
  currency: string | null;
  period: CompensationPeriod | null;
}

export interface CareerPreferences {
  desired_roles: string[];
  preferred_domains: string[];
  preferred_locations: string[];
  relocation_willingness: RelocationWillingness;
  work_mode: WorkModePreference;
  industry_preferences: string[];
  employment_status: EmploymentStatus;
  open_to_work: boolean;
  expected_compensation: CompensationExpectation | null;
  start_date_raw: string | null;
  work_auth_raw: string | null;
}

// ── Risk Signals ──────────────────────────────────────────────────────────────

export interface RiskSignals {
  job_hopping_risk: RiskLevel;
  job_hopping_detail: string | null;
  evidence_gap_risk: RiskLevel;
  evidence_gap_detail: string | null;
  employment_gap_risk: RiskLevel;
  employment_gap_months: number;
  specialization_fragility_risk: RiskLevel;
  extraction_risk: RiskLevel;
  overqualification_risk: RiskLevel;
  underqualification_risk: RiskLevel;
  overall_risk_level: RiskLevel;
  risk_flags: string[];
}

// ── Career Trajectory ─────────────────────────────────────────────────────────

export interface CareerTrajectory {
  direction: CareerDirection;
  velocity: CareerVelocity;
}
