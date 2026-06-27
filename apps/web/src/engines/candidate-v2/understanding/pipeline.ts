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

// Run the full 16-stage understanding pipeline.
// Input: PreflightInput from the ingestion adapter.
// Output: ValidationOutput always — never throws.
//
// On PreflightError (unrecoverable document): returns a minimal profile
// with extraction_confidence = 0 and the error in parsing_warnings.
export async function runUnderstandingPipeline(
  input: PreflightInput,
): Promise<ValidationOutput> {
  // TODO: implement sequential stage execution
  //
  // Stage 0 — Pre-flight (may throw PreflightError → abort pipeline)
  // Stage 1 — Section Detection
  // Stages 2–9 — Claude extraction stages (parallel where possible; catch each individually)
  // Stage 10 — Quality Signal Computation
  // Stage 11 — Risk Analysis
  // Stage 12 — Recruiter Signals
  // Stage 13 — Archetype Classification
  // Stage 14 — Assembly
  // Stage 15 — Validation
  void input;
  void runStage0Preflight;
  void PreflightError;
  void runStage1Sections;
  void runStage2Identity; void IDENTITY_STAGE_DEFAULTS;
  void runStage3Skills; void SKILLS_STAGE_DEFAULTS;
  void runStage4Experience; void EXPERIENCE_STAGE_DEFAULTS;
  void runStage5Projects; void PROJECTS_STAGE_DEFAULTS;
  void runStage6Education; void EDUCATION_STAGE_DEFAULTS;
  void runStage7Evidence; void EVIDENCE_STAGE_DEFAULTS;
  void runStage8Communication; void COMMUNICATION_STAGE_DEFAULTS;
  void runStage9Preferences; void PREFERENCES_STAGE_DEFAULTS;
  void runStage10Quality;
  void runStage11Risk;
  void runStage12RecruiterSignals;
  void runStage13Archetype; void ARCHETYPE_STAGE_DEFAULTS;
  void runStage14Assembly;
  void runStage15Validation;
  throw new Error("TODO: implement runUnderstandingPipeline");
}
