export function toPublicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("already a pending proposal")) {
    return "There is already a pending proposal for this target.";
  }

  if (message.includes("insufficient budget") || message.includes("insufficient cash")) {
    return "Insufficient budget for this operation.";
  }

  if (message.includes("not eligible")) {
    return "This target is not eligible for negotiation right now.";
  }

  if (message.includes("already completed")) {
    return "This session has already been completed.";
  }

  if (message.includes("already generated")) {
    return "This weekend has already been generated.";
  }

  if (message.includes("already active with this team")) {
    return "This sponsor is already active with your team.";
  }

  if (message.includes("sponsor slots") || message.includes("slots are already filled")) {
    return "All sponsor slots are occupied right now.";
  }

  if (message.includes("not found")) {
    return "The requested data could not be found.";
  }

  return fallback;
}
