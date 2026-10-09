const DEFAULT_BASE = "http://localhost:8787";

export type ApiClientOptions = {
  baseUrl?: string;
  getToken: () => string | null;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.options.getToken();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${this.options.baseUrl ?? DEFAULT_BASE}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 204) return undefined as T;

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = body?.error?.message ?? `Request failed (${res.status})`;
      const error = new Error(message) as Error & { status?: number; code?: string };
      error.status = res.status;
      error.code = body?.error?.code;
      throw error;
    }
    return body as T;
  }

  health() {
    return this.request<{ status: string }>("/v1/health");
  }

  getProfile() {
    return this.request<{
      profile: Record<string, unknown>;
      targets: {
        caloriesKcal: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        source: string;
      };
      suggestedTargets: Record<string, unknown>;
    }>("/v1/profile");
  }

  onboard(payload: unknown) {
    return this.request<{ profile: unknown; targets: unknown }>("/v1/onboarding", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  updateProfile(payload: unknown) {
    return this.request("/v1/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  putTargets(payload: unknown) {
    return this.request("/v1/targets", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  searchFoods(q: string) {
    return this.request<{ items: Food[]; degraded?: boolean }>(
      `/v1/foods/search?q=${encodeURIComponent(q)}`,
    );
  }

  lookupBarcode(barcode: string) {
    return this.request<{ food: Food }>(`/v1/foods/barcode/${encodeURIComponent(barcode)}`);
  }

  createFood(payload: unknown) {
    return this.request<{ food: Food }>("/v1/foods", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  bookmarks() {
    return this.request<{ items: Food[] }>("/v1/foods/bookmarks");
  }

  getDiary(date: string) {
    return this.request<DayDiary>(`/v1/diary?date=${encodeURIComponent(date)}`);
  }

  logDiary(payload: unknown) {
    return this.request<{ entry: DiaryEntry; day: DayDiary }>("/v1/diary", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  deleteDiary(id: string) {
    return this.request<void>(`/v1/diary/${id}`, { method: "DELETE" });
  }

  syncDiary(entries: unknown[]) {
    return this.request<{ created: unknown[]; duplicates: string[] }>("/v1/diary/sync", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
  }
}

export type Food = {
  id: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  servingLabel: string;
  servingGrams: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bookmarked?: boolean;
  source?: string;
};

export type DiaryEntry = {
  id: string;
  foodName: string;
  mealSlot: string;
  quantity: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type DayDiary = {
  date: string;
  targets: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  logged: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  remaining: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  nextMealBudgetKcal: number;
  entries: DiaryEntry[];
};
