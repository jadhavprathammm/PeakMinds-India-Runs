// Adapter: recruiter CSV rows (DatasetCandidate) → engine CandidateProfile.
//
// The Team Intelligence engine scores CandidateProfile against TeamDNA, but the
// recruiter upload flow only has lightweight DatasetCandidate rows {name, resume,
// skills, experience}. This adapter builds a minimal-but-useful CandidateProfile
// from those fields so Team Intelligence can run additively, without invoking the
// heavy 16-stage understanding pipeline.
//
// This is integration glue for the recruiter feature — it does not live inside the
// isolated engine and touches no protected file.

import type { DatasetCandidate } from "@/lib/dataset";
import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { SeniorityLevel } from "@/engines/shared/types/enums";
import type { CandidateForTeam } from "@/engines/team-intelligence";

function splitSkills(s: string): string[] {
  return s
    .split(/[,;/|\n]+|\band\b/i)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2 && x.length <= 40);
}

function parseYears(text: string): number {
  const m = text.match(/(\d{1,2})\+?\s*years?/i) ?? text.match(/^\s*(\d{1,2})\s*$/);
  const y = m ? parseInt(m[1], 10) : 0;
  return Number.isNaN(y) ? 0 : y;
}

function inferSeniority(text: string, years: number): SeniorityLevel {
  const t = text.toLowerCase();
  if (/\bprincipal\b/.test(t)) return "principal";
  if (/\bstaff\b/.test(t)) return "staff";
  if (/\b(senior|sr\.?|lead|head)\b/.test(t)) return "senior";
  if (/\b(junior|jr\.?|intern|entry)\b/.test(t)) return "junior";
  if (years >= 9) return "principal";
  if (years >= 5) return "senior";
  if (years >= 2) return "mid";
  if (years > 0) return "junior";
  return "unknown";
}

/** Build a full CandidateProfile with safe defaults, overriding the fields we can infer. */
function baseProfile(): CandidateProfile {
  return {
    candidate_name: null, current_title: null, current_company: null, years_experience: 0,
    location: null, contact_email: null,
    technical_skills: [], tools: [], frameworks: [], cloud_platforms: [], databases: [], domain_keywords: [],
    role_history: [], total_ml_months: 0, has_management_experience: false,
    leadership_signals: { managed_teams: false, team_size_estimate: null, led_cross_functional_projects: false, mentored_juniors: false, presented_externally: false },
    ownership_signals: { shipped_to_production: false, owned_full_pipeline: false, led_architecture_decisions: false, drove_measurable_outcomes: false },
    highest_degree: null, field_of_study: null, institution: null, graduation_year: null, has_ml_related_degree: false,
    certifications: [], spoken_languages: [],
    quantified_achievements: [], production_deployments: [], open_source_contributions: [], awards_and_recognition: [], publications: [],
    resume_quality: "adequate", evidence_strength: "descriptive", career_consistency: "mixed", extraction_confidence: 0.5, parsing_warnings: [],
    seniority_level: "unknown", primary_role_family: "unknown", secondary_role_families: [], role_family: "unknown", role_family_confidence: 0,
    specializations: [], is_career_changer: false, has_pre_llm_depth: false,
    career_trajectory: { direction: "lateral", velocity: "steady" }, domain_posture: "balanced", profile_completeness: 0.5,
    career_preferences: { desired_roles: [], preferred_domains: [], preferred_locations: [], relocation_willingness: "unknown", work_mode: "unknown", industry_preferences: [], employment_status: "unknown", open_to_work: false, expected_compensation: null, start_date_raw: null, work_auth_raw: null },
    projects: [],
    communication_signals: { presentations: [], technical_writing: { has_technical_blog: false, blog_platform: null, blog_url: null, estimated_post_count: null, writing_topics: [] }, mentoring: { formal_mentoring_role: false, junior_coaching_described: false, onboarding_described: false, mentees_count_estimate: null }, community: { open_source_maintainer: false, conference_organizer: false, community_names: [], stackoverflow_reputation_mentioned: false }, communication_tier: "moderate", publication_count: 0, communication_score: 0 },
    risk_signals: { job_hopping_risk: "none", job_hopping_detail: null, evidence_gap_risk: "none", evidence_gap_detail: null, employment_gap_risk: "none", employment_gap_months: 0, specialization_fragility_risk: "none", extraction_risk: "low", overqualification_risk: "none", underqualification_risk: "none", overall_risk_level: "low", primary_risk_factor: "none", risk_flags: [] },
    archetype: "generalist", key_differentiators: [],
  };
}

/** ALL-CAPS acronyms (AWS, GCP, SQL, HIPAA…) — strong skill signals in any field. */
function extractAcronyms(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b([A-Z][A-Z0-9]{1,5})\b/g)) {
    if (!/^\d+$/.test(m[1])) out.add(m[1]);
  }
  return [...out];
}

/** Multi-word skill phrases double as coarse domain hints ("machine learning"). */
function domainHints(skills: string[]): string[] {
  return skills.filter((s) => s.includes(" ")).slice(0, 8);
}

/** Coarse archetype from resume verbs — feeds the work-style axis (was always "generalist"). */
function inferArchetype(t: string): CandidateProfile["archetype"] {
  if (/\bco-?founder\b|\bfounded\b/.test(t)) return "founder";
  if (/\bresearch\b|\bpublished\b|\bpaper\b|\bphd\b/.test(t)) return "researcher";
  if (/\bon-?call\b|\bsre\b|\breliability\b|\bincident\b|\boperations\b/.test(t)) return "operator";
  if (/\bmanaged\b|\bdirector\b|\bhead of\b|\bled a team\b/.test(t)) return "leader";
  if (/\bbuilt\b|\bshipped\b|\blaunched\b|\bprototyp/.test(t)) return "builder";
  return "generalist";
}

/** Map one DatasetCandidate → CandidateProfile (best-effort, enriched). */
export function datasetCandidateToProfile(c: DatasetCandidate): CandidateProfile {
  const p = baseProfile();
  const blob = [c.resume, c.skills, c.experience].filter(Boolean).join(". ");
  const t = blob.toLowerCase();

  p.candidate_name = c.name || null;

  // Skills: the declared skills column + acronyms discovered in the resume body,
  // deduped. Richer skill sets improve skill overlap, contribution, and the
  // semantic vector (profileToText embeds these fields).
  const declared = splitSkills(c.skills || "");
  const merged = new Map<string, string>();
  for (const s of [...declared, ...extractAcronyms([c.resume, c.experience].filter(Boolean).join(" "))]) {
    const k = s.toLowerCase();
    if (!merged.has(k)) merged.set(k, s);
  }
  p.technical_skills = [...merged.values()];
  p.domain_keywords = domainHints(p.technical_skills); // ponytail: coarse; semantic axis carries the real domain match now

  p.years_experience = parseYears(c.experience || blob);
  p.seniority_level = inferSeniority(blob, p.years_experience);
  p.archetype = inferArchetype(t);

  // Leadership signals (domain-agnostic keywords).
  p.leadership_signals.managed_teams = /\bmanaged\b|\bmanager\b|\bteam of\b/.test(t);
  p.leadership_signals.led_cross_functional_projects = /\bled\b|\bcross-functional\b/.test(t);
  p.leadership_signals.mentored_juniors = /\bmentor/.test(t);
  p.leadership_signals.presented_externally = /\bspoke at\b|\bconference\b|\bkeynote\b|\bpresented\b/.test(t);
  p.has_management_experience = p.leadership_signals.managed_teams;

  // Ownership signals → feed the work-style axis ("ownership"/"autonomous").
  p.ownership_signals.shipped_to_production = /\bshipped\b|\bproduction\b|\bdeployed\b|\blaunched\b/.test(t);
  p.ownership_signals.owned_full_pipeline = /\bend-to-end\b|\bowned\b|\bfull pipeline\b/.test(t);
  p.ownership_signals.led_architecture_decisions = /\barchitect|\bsystem design\b/.test(t);
  p.ownership_signals.drove_measurable_outcomes = /\d+\s?%|\bincreased\b|\breduced\b|\bimproved\b|\bgrew\b|\bsaved\b/.test(t);

  if (/\bremote\b/.test(t)) p.career_preferences.work_mode = "remote";
  else if (/\bhybrid\b/.test(t)) p.career_preferences.work_mode = "hybrid";
  else if (/\bon-?site\b/.test(t)) p.career_preferences.work_mode = "onsite";

  return p;
}

/** Build the CandidateForTeam[] the orchestrator expects, keyed by candidate name. */
export function toCandidatesForTeam(candidates: DatasetCandidate[]): CandidateForTeam[] {
  return candidates.map((c, i) => ({
    candidate_id: c.name || `Candidate ${i + 1}`,
    profile: datasetCandidateToProfile(c),
  }));
}
