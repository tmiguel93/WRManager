export function calculateIncidentEnvelope(input: {
  reliabilityRisk: number;
  aggression: number;
  weatherSeverity: number;
}) {
  const reliabilityWeight = input.reliabilityRisk * 0.42;
  const aggressionWeight = input.aggression * 0.18;
  const weatherWeight = input.weatherSeverity * 0.26;
  const baseRisk = reliabilityWeight + aggressionWeight + weatherWeight;

  return {
    minorIncidentChance: Math.max(2, Math.min(45, baseRisk / 2.7)),
    majorIncidentChance: Math.max(0.5, Math.min(18, baseRisk / 9.5)),
  };
}
