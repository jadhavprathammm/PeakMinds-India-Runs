// Recommendations Engine — generates actionable improvement roadmap from gaps.
// Consumed by the candidate-review experience.

import type { CandidateProfile } from "@/engines/shared/types/candidate-profile-v2";
import type { Gap } from "@/engines/candidate-v2/gaps";

export interface ImprovementRoadmapV2 {
  immediate: string[];   // Can be done today (reword, reframe)
  seven_day: string[];   // Can be done this week (add missing context)
  thirty_day: string[];  // Requires new work (project, certification, skill)
}

// Generate an improvement roadmap from a profile and its computed gaps.
export function generateRecommendations(
  profile: CandidateProfile,
  gaps: Gap[],
): ImprovementRoadmapV2 {
  // TODO: implement
  //   Map gap.severity to timeline tier:
  //     critical + skill → thirty_day (acquire the skill)
  //     high + experience → seven_day (add more context to existing roles)
  //     medium + framing → immediate (reword existing bullets)
  void profile; void gaps;
  throw new Error("TODO: implement generateRecommendations");
}
