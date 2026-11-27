// Simple sanity limits so typos like a 34,343 kg goat can't be saved.
export const LIMITS = {
  maxWeightKg: 400, // big boars can pass 300 kg; goats stay far below
  maxAmount: 10000000, // ₹1 crore per entry
  maxFeedKg: 5000,
};

export function checkNumber(value: unknown, label: string, min: number, max: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
  return null;
}

export function checkDate(value: unknown, label: string, allowFuture = false): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return `${label} is not a valid date`;
  if (!allowFuture && d.getTime() > Date.now() + 24 * 60 * 60 * 1000) return `${label} can't be in the future`;
  return null;
}

export function firstError(...errors: (string | null)[]) {
  return errors.find((e) => e) || null;
}
