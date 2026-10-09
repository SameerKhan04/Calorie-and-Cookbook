export type CatalogFood = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  servingLabel: string;
  servingGrams: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "open_food_facts" | "custom" | "cache";
};

export type FoodCatalog = {
  search(query: string, limit: number): Promise<CatalogFood[]>;
  byBarcode(barcode: string): Promise<CatalogFood | null>;
};

/** Offline-safe stub; real OFF client can replace this via env later. */
export function createStubCatalog(seed: CatalogFood[] = []): FoodCatalog {
  return {
    async search(query, limit) {
      const q = query.toLowerCase();
      return seed.filter((f) => f.name.toLowerCase().includes(q)).slice(0, limit);
    },
    async byBarcode(barcode) {
      return seed.find((f) => f.barcode === barcode) ?? null;
    },
  };
}
