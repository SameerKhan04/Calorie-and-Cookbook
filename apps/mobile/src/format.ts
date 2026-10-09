import { kcalToKj } from "@cac/domain";

// Display helpers for AU dual energy labels.

export function formatEnergy(kcal: number): string {
  const rounded = Math.round(kcal);
  const kj = Math.round(kcalToKj(rounded));
  return `${rounded} kcal · ${kj} kJ`;
}

export function formatMacroLine(proteinG: number, carbsG: number, fatG: number): string {
  return `P ${Math.round(proteinG)}g · C ${Math.round(carbsG)}g · F ${Math.round(fatG)}g`;
}

export function todayDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
