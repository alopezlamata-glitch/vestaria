/** Compact, sortable-enough unique id. Avoids pulling in a uuid dependency. */
export function generateId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${time}${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayDateString(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
