const labelMap: Record<string, string> = {
  batches: "Batches",
  faculty: "Faculty",
  chapters: "Chapters",
  notes: "Notes",
  dpps: "DPPs",
  tests: "Tests",
  questions: "Questions",
  studentRatings: "Student ratings",
};

export function formatLinkSummary(links?: Record<string, number>): string {
  if (!links) return "";
  const lines = Object.entries(links)
    .filter(([, count]) => Number(count) > 0)
    .map(([key, count]) => `${labelMap[key] || key}: ${count}`);
  return lines.join("\n");
}
