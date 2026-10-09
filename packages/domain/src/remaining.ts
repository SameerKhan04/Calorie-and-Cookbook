export type MacroTotals = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function remainingMacros(target: MacroTotals, logged: MacroTotals): MacroTotals {
  return {
    caloriesKcal: target.caloriesKcal - logged.caloriesKcal,
    proteinG: target.proteinG - logged.proteinG,
    carbsG: target.carbsG - logged.carbsG,
    fatG: target.fatG - logged.fatG,
  };
}

export function nextMealBudget(remainingCaloriesKcal: number, mealsLeft: number): number {
  if (mealsLeft <= 0) return 0;
  return Math.floor(remainingCaloriesKcal / mealsLeft);
}
