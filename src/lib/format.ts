const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactMoney(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatDate(valueIso: string) {
  return dateFormatter.format(new Date(`${valueIso}T00:00:00Z`));
}

export function clampPercent(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;
}

export function formatAge(birthDateIso: string | Date) {
  const birthDate = typeof birthDateIso === "string" ? new Date(birthDateIso) : birthDateIso;
  const now = new Date();
  const years = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthday =
    now.getUTCMonth() > birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() >= birthDate.getUTCDate());
  return hadBirthday ? years : years - 1;
}
