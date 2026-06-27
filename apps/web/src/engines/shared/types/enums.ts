// All string literal union types (enums) for CandidateProfile V2.
// No runtime values — TypeScript type system only.

export type DegreeLevel =
  | "phd"
  | "master"
  | "bachelor"
  | "diploma"
  | "bootcamp"
  | "self_taught";

export type RiskLevel = "none" | "low" | "moderate" | "high" | "critical";

export type RoleClass =
  | "core_ml"
  | "ml_adjacent"
  | "research"
  | "swe_generic"
  | "management"
  | "data_engineering"
  | "unknown";

export type ProjectComplexity =
  | "trivial"
  | "simple"
  | "moderate"
  | "complex"
  | "highly_complex";

export type OwnershipLevel = "solo" | "lead" | "contributor" | "observer";

export type ProjectSource = "personal" | "work" | "open_source" | "academic";

export type AudienceScope = "internal" | "local" | "national" | "international";

export type ProficiencyLevel =
  | "native"
  | "fluent"
  | "professional"
  | "conversational"
  | "basic";

export type SeniorityLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "unknown";

export type RoleFamily =
  | "ml_engineering"
  | "data_science"
  | "research"
  | "mlops"
  | "software_engineering"
  | "management"
  | "unknown";

// All 8 archetypes from the design document
export type CandidateArchetype =
  | "builder"
  | "researcher"
  | "operator"
  | "generalist"
  | "specialist"
  | "leader"
  | "founder"
  | "transitioner";

export type DocumentQuality =
  | "unusable"
  | "poor"
  | "acceptable"
  | "good"
  | "excellent";

export type ResumeQuality = "sparse" | "adequate" | "strong" | "exceptional";

export type EvidenceStrength =
  | "anecdotal"
  | "descriptive"
  | "quantified"
  | "verified";

export type CareerConsistency =
  | "fragmented"
  | "mixed"
  | "consistent"
  | "linear";

export type WorkModePreference = "remote" | "hybrid" | "onsite" | "unknown";

export type RelocationWillingness = "yes" | "no" | "open" | "unknown";

export type EmploymentStatus =
  | "actively_looking"
  | "open_to_opportunities"
  | "not_looking"
  | "unknown";

export type CommunicationTier =
  | "minimal"
  | "moderate"
  | "strong"
  | "exceptional";

export type DomainPosture =
  | "deep_specialist"
  | "specialist"
  | "balanced"
  | "generalist"
  | "unfocused";

export type CareerDirection =
  | "ascending"
  | "lateral"
  | "descending"
  | "pivoting";

export type CareerVelocity = "fast" | "steady" | "slow";

export type SourceFormat = "pdf" | "docx" | "txt" | "image" | "paste";

export type ContributionType = "creator" | "maintainer" | "contributor";

export type CompensationPeriod = "annual" | "monthly" | "hourly";
