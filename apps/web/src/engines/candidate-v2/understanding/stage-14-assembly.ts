// Stage 14 — Assembly
// No Claude call. Pure merge of all stage outputs into a single CandidateProfile.
// Applies conflict resolution rules and backward-compat aliases.
// Fields owned: the complete CandidateProfile object. No new fields.

import type { AllStageOutputs, AssemblyOutput } from "@/engines/shared/types/stage-outputs";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type {
  ResumeQuality,
  EvidenceStrength,
  RoleFamily,
  CareerDirection,
  CareerVelocity,
  EmploymentStatus,
  WorkModePreference,
  RelocationWillingness,
  CommunicationTier,
  DomainPosture,
} from "@/engines/shared/types/enums";

export function runStage14Assembly(stages: AllStageOutputs): AssemblyOutput {
  const warnings: string[] = [];

  const draft = assembleDraftProfile(stages, warnings);

  const resolved = resolveConflicts(draft, stages, warnings);

  const profile: CandidateProfile = {
    candidate_name: resolved.candidate_name ?? null,
    current_title: resolved.current_title ?? null,
    current_company: resolved.current_company ?? null,
    years_experience: resolved.years_experience ?? 0,
    location: resolved.location ?? null,
    contact_email: resolved.contact_email ?? null,

    technical_skills: resolved.technical_skills ?? [],
    tools: resolved.tools ?? [],
    frameworks: resolved.frameworks ?? [],
    cloud_platforms: resolved.cloud_platforms ?? [],
    databases: resolved.databases ?? [],
    domain_keywords: resolved.domain_keywords ?? [],

    role_history: resolved.role_history ?? [],
    total_ml_months: resolved.total_ml_months ?? 0,
    has_management_experience: resolved.has_management_experience ?? false,
    leadership_signals: resolved.leadership_signals ?? {
      managed_teams: false,
      team_size_estimate: null,
      led_cross_functional_projects: false,
      mentored_juniors: false,
      presented_externally: false,
    },
    ownership_signals: resolved.ownership_signals ?? {
      shipped_to_production: false,
      owned_full_pipeline: false,
      led_architecture_decisions: false,
      drove_measurable_outcomes: false,
    },

    highest_degree: resolved.highest_degree ?? null,
    field_of_study: resolved.field_of_study ?? null,
    institution: resolved.institution ?? null,
    graduation_year: resolved.graduation_year ?? null,
    has_ml_related_degree: resolved.has_ml_related_degree ?? false,
    certifications: resolved.certifications ?? [],
    spoken_languages: resolved.spoken_languages ?? [],

    quantified_achievements: resolved.quantified_achievements ?? [],
    production_deployments: resolved.production_deployments ?? [],
    open_source_contributions: resolved.open_source_contributions ?? [],
    awards_and_recognition: resolved.awards_and_recognition ?? [],
    publications: resolved.publications ?? [],

    resume_quality: resolved.resume_quality ?? ("adequate" as ResumeQuality),
    evidence_strength: resolved.evidence_strength ?? ("anecdotal" as EvidenceStrength),
    career_consistency: resolved.career_consistency ?? "consistent",
    extraction_confidence: resolved.extraction_confidence ?? 0.5,
    parsing_warnings: resolved.parsing_warnings ?? [],

    seniority_level: resolved.seniority_level ?? "junior",
    primary_role_family: resolved.primary_role_family ?? ("ml_engineering" as RoleFamily),
    secondary_role_families: resolved.secondary_role_families ?? [],
    role_family: resolved.role_family ?? resolved.primary_role_family ?? ("ml_engineering" as RoleFamily),
    role_family_confidence: resolved.role_family_confidence ?? 0.5,
    specializations: resolved.specializations ?? [],
    is_career_changer: resolved.is_career_changer ?? false,
    has_pre_llm_depth: resolved.has_pre_llm_depth ?? false,
    career_trajectory: resolved.career_trajectory ?? ({ direction: "lateral" as CareerDirection, velocity: "steady" as CareerVelocity }),
    domain_posture: resolved.domain_posture ?? ("specialist" as DomainPosture),
    profile_completeness: resolved.profile_completeness ?? 0,

    career_preferences: resolved.career_preferences ?? {
      desired_roles: [],
      preferred_domains: [],
      preferred_locations: [],
      relocation_willingness: "unknown" as RelocationWillingness,
      work_mode: "unknown" as WorkModePreference,
      industry_preferences: [],
      employment_status: "unknown" as EmploymentStatus,
      open_to_work: false,
      expected_compensation: null,
      start_date_raw: null,
      work_auth_raw: null,
    },

    projects: resolved.projects ?? [],

    communication_signals: resolved.communication_signals ?? {
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
      communication_tier: "minimal" as CommunicationTier,
      publication_count: 0,
    },

    risk_signals: resolved.risk_signals ?? {
      job_hopping_risk: "low",
      job_hopping_detail: null,
      evidence_gap_risk: "low",
      evidence_gap_detail: null,
      employment_gap_risk: "low",
      employment_gap_months: 0,
      specialization_fragility_risk: "low",
      extraction_risk: "low",
      overqualification_risk: "low",
      underqualification_risk: "low",
      overall_risk_level: "low",
      risk_flags: [],
    },

    archetype: resolved.archetype ?? "generalist",
    key_differentiators: resolved.key_differentiators ?? [],
  };

  return { profile, assembly_warnings: warnings };
}

function assembleDraftProfile(stages: AllStageOutputs, warnings: string[]): Partial<CandidateProfile> {
  const { identity, skills, experience, projects, education, evidence, communication, preferences, quality, risk, recruiter, archetype } = stages;

  const draft: Partial<CandidateProfile> = {};

  draft.candidate_name = identity.candidate_name;
  draft.current_title = identity.current_title;
  draft.current_company = identity.current_company;
  draft.years_experience = identity.years_experience ?? 0;
  draft.location = identity.location;
  draft.contact_email = identity.contact_email;

  draft.technical_skills = skills.technical_skills;
  draft.tools = skills.tools;
  draft.frameworks = skills.frameworks;
  draft.cloud_platforms = skills.cloud_platforms;
  draft.databases = skills.databases;
  draft.domain_keywords = skills.domain_keywords;

  draft.role_history = experience.role_history;
  draft.total_ml_months = experience.total_ml_months;
  draft.has_management_experience = experience.has_management_experience;
  draft.leadership_signals = experience.leadership_signals;
  draft.ownership_signals = experience.ownership_signals;

  draft.highest_degree = education.highest_degree;
  draft.field_of_study = education.field_of_study;
  draft.institution = education.institution;
  draft.graduation_year = education.graduation_year;
  draft.has_ml_related_degree = education.has_ml_related_degree;
  draft.certifications = education.certifications;
  draft.spoken_languages = education.spoken_languages;

  draft.quantified_achievements = evidence.quantified_achievements;
  draft.production_deployments = evidence.production_deployments;
  draft.open_source_contributions = evidence.open_source_contributions;
  draft.awards_and_recognition = evidence.awards_and_recognition;
  draft.publications = evidence.publications;

  draft.resume_quality = quality.resume_quality;
  draft.evidence_strength = quality.evidence_strength;
  draft.career_consistency = quality.career_consistency;
  draft.extraction_confidence = quality.extraction_confidence;
  draft.parsing_warnings = quality.parsing_warnings;

  draft.seniority_level = recruiter.seniority_level;
  draft.primary_role_family = recruiter.primary_role_family;
  draft.secondary_role_families = recruiter.secondary_role_families;
  draft.role_family_confidence = recruiter.role_family_confidence;
  draft.specializations = recruiter.specializations;
  draft.is_career_changer = recruiter.is_career_changer;
  draft.has_pre_llm_depth = recruiter.has_pre_llm_depth;
  draft.career_trajectory = recruiter.career_trajectory;
  draft.domain_posture = recruiter.domain_posture;
  draft.profile_completeness = recruiter.profile_completeness;

  draft.career_preferences = preferences.career_preferences;

  draft.projects = projects.projects;

  draft.communication_signals = communication.communication_signals ?? {
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
    communication_tier: "minimal" as CommunicationTier,
    publication_count: 0,
  };

  draft.risk_signals = risk.risk_signals;

  draft.archetype = archetype.primary_archetype;
  draft.key_differentiators = archetype.key_differentiators;

  return draft;
}

export function resolveYoE(
  stated: number | null,
  computed: number | null,
): number {
  if (stated === null && computed === null) {
    return 0;
  }
  if (stated === null) {
    return computed ?? 0;
  }
  if (computed === null) {
    return stated;
  }
  const delta = Math.abs(stated - computed);
  if (delta <= 2) {
    return computed;
  }
  return stated;
}

export function resolveConflicts(
  draft: Partial<CandidateProfile>,
  stages: AllStageOutputs,
  warnings: string[],
): Partial<CandidateProfile> {
  const statedYoE = stages.identity.years_experience;
  const computedYoE = stages.experience.computed_yoe;
  const resolvedYoE = resolveYoE(statedYoE, computedYoE);
  draft.years_experience = resolvedYoE;
  if (statedYoE !== null && computedYoE !== null && Math.abs(statedYoE - computedYoE) > 2) {
    warnings.push("YOE_CONFLICT_LARGE_DELTA");
  }

  const currentRoles = draft.role_history?.filter((r) => r.is_current) ?? [];
  if (currentRoles.length > 1) {
    const withStartYear = currentRoles.filter((r) => r.start_year !== null);
    if (withStartYear.length > 0) {
      withStartYear.sort((a, b) => (b.start_year ?? 0) - (a.start_year ?? 0));
      const keep = withStartYear[0];
      for (const r of currentRoles) {
        if (r !== keep) {
          r.is_current = false;
        }
      }
      warnings.push("MULTIPLE_CURRENT_ROLES_RESOLVED");
    }
  }

  if (draft.publications) {
    draft.communication_signals = draft.communication_signals ?? {
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
      communication_tier: "minimal" as CommunicationTier,
      publication_count: 0,
    };
    draft.communication_signals.publication_count = draft.publications.length;
  }

  draft.role_family = draft.primary_role_family ?? ("ml_engineering" as RoleFamily);

  let completeness = 0;
  const fieldsToCheck: (keyof CandidateProfile)[] = [
    "candidate_name", "current_title", "current_company", "years_experience",
    "location", "contact_email", "technical_skills", "role_history",
    "highest_degree", "field_of_study", "institution", "graduation_year",
    "certifications", "spoken_languages", "quantified_achievements",
    "production_deployments", "open_source_contributions", "awards_and_recognition",
    "publications", "projects", "career_preferences", "communication_signals",
    "risk_signals", "archetype", "key_differentiators",
  ];
  for (const field of fieldsToCheck) {
    const value = draft[field];
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        if (value.length > 0) completeness++;
      } else if (typeof value === "object") {
        completeness++;
      } else {
        completeness++;
      }
    }
  }
  draft.profile_completeness = Math.round((completeness / fieldsToCheck.length) * 100);

  return draft;
}