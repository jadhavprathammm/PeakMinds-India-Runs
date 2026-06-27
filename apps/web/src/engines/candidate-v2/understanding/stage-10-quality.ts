// Stage 10 — Quality Signal Computation
// No Claude call. Pure deterministic computation over all prior stage outputs.
// Fields owned: resume_quality, evidence_strength, career_consistency,
//               extraction_confidence, parsing_warnings.

import type {
  PreflightOutput,
  SectionDetectionOutput,
  IdentityOutput,
  SkillsOutput,
  ExperienceOutput,
  EvidenceOutput,
  QualityOutput,
} from "@/engines/shared/types/stage-outputs";
import type { ResumeQuality, EvidenceStrength, CareerConsistency } from "@/engines/shared/types/enums";

// Run Stage 10.
// No Claude call — reads outputs from Stages 0–9.
export function runStage10Quality(
  preflight: PreflightOutput,
  sections: SectionDetectionOutput,
  identity: IdentityOutput,
  skills: SkillsOutput,
  experience: ExperienceOutput,
  evidence: EvidenceOutput,
  stageConfidences: Record<string, number>,
  allWarnings: string[][],
): QualityOutput {
  // TODO: implement
  //   1. computeResumeQuality(...)
  //   2. computeEvidenceStrength(...)
  //   3. computeCareerConsistency(...)
  //   4. computeExtractionConfidence(stageConfidences)
  //   5. collectWarnings(allWarnings)
  void preflight; void sections; void identity; void skills;
  void experience; void evidence; void stageConfidences; void allWarnings;
  throw new Error("TODO: implement Stage 10 — Quality Signals");
}

// 6-point scoring rubric from the spec.
// score 0-1 → "sparse", 2-3 → "adequate", 4-5 → "strong", 6 → "exceptional"
export function computeResumeQuality(
  wordCount: number,
  sectionCount: number,
  roleCount: number,
  achievementCount: number,
  totalSkillCount: number,
  sectionConfidence: number,
): ResumeQuality {
  // TODO: implement
  //   if word_count >= 300: score += 1
  //   if section_count >= 3: score += 1
  //   if role_history.length >= 2: score += 1
  //   if quantified_achievements.length >= 1: score += 1
  //   if skills total >= 10: score += 1
  //   if section_confidence >= 0.7: score += 1
  void wordCount; void sectionCount; void roleCount;
  void achievementCount; void totalSkillCount; void sectionConfidence;
  return "adequate";
}

// Three-tier evidence strength from the spec.
export function computeEvidenceStrength(
  achievements: EvidenceOutput["quantified_achievements"],
  openSource: EvidenceOutput["open_source_contributions"],
  publications: EvidenceOutput["publications"],
): EvidenceStrength {
  // TODO: implement
  //   no achievements          → "anecdotal"
  //   all metrics null         → "descriptive"
  //   some metrics non-null    →
  //     if open_source with url OR publications: "verified"
  //     else: "quantified"
  void achievements; void openSource; void publications;
  return "anecdotal";
}

// Career consistency from avg_tenure and short_stint_ratio.
export function computeCareerConsistency(
  roleHistory: ExperienceOutput["role_history"],
): CareerConsistency {
  // TODO: implement
  //   avg_tenure = mean(duration_months)
  //   short_stint_ratio = n_short_stints / role_history.length
  //   "fragmented" → avg_tenure < 12 AND short_stint_ratio > 0.5
  //   "mixed"      → avg_tenure in [12, 24] OR short_stint_ratio in [0.25, 0.5]
  //   "consistent" → avg_tenure in [24, 48] AND short_stint_ratio < 0.25
  //   "linear"     → avg_tenure > 48 AND titles show progression
  void roleHistory;
  return "mixed";
}

// Collect and deduplicate warnings from all prior stages.
export function collectAllWarnings(warningArrays: string[][]): string[] {
  // TODO: implement dedup and severity ordering (critical first)
  void warningArrays;
  return [];
}
