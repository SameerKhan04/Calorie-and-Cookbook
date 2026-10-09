const KJ_PER_KCAL = 4.184;

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
}

export function kcalToKj(kcal: number): number {
  assertNonNegative(kcal, "kcal");
  return kcal * KJ_PER_KCAL;
}

export function kjToKcal(kj: number): number {
  assertNonNegative(kj, "kJ");
  return kj / KJ_PER_KCAL;
}

export { KJ_PER_KCAL };
