export function canonicalText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalFullName(first: string, last: string) {
  return canonicalText(`${first} ${last}`.trim());
}

export function canonicalKey(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => canonicalText(part ?? ""))
    .filter(Boolean)
    .join("::");
}
