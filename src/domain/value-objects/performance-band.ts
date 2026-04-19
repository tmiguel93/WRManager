export type PerformanceBand = "ELITE" | "STRONG" | "SOLID" | "MIDFIELD" | "DEVELOPING";

export function toPerformanceBand(score: number): PerformanceBand {
  if (score >= 90) return "ELITE";
  if (score >= 82) return "STRONG";
  if (score >= 74) return "SOLID";
  if (score >= 66) return "MIDFIELD";
  return "DEVELOPING";
}
