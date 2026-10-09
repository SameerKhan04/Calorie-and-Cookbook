export type QueuedDiaryEntry = {
  clientId: string;
  foodId: string;
  loggedAt: string;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
  quantity: number;
  notes?: string;
};

export type SyncResult = {
  created: string[];
  duplicates: string[];
};

export type OfflineDiaryQueueDeps = {
  isOnline: () => boolean;
  sync: (entries: QueuedDiaryEntry[]) => Promise<SyncResult>;
};

export class OfflineDiaryQueue {
  private items: QueuedDiaryEntry[] = [];
  private onlineOverride: boolean | null = null;

  constructor(private readonly deps: OfflineDiaryQueueDeps) {}

  setOnline(online: boolean): void {
    this.onlineOverride = online;
  }

  private online(): boolean {
    return this.onlineOverride ?? this.deps.isOnline();
  }

  pending(): QueuedDiaryEntry[] {
    return [...this.items];
  }

  async enqueue(entry: QueuedDiaryEntry): Promise<void> {
    // Local-first: always accept; callers flush when connectivity allows.
    this.items.push(entry);
  }

  async flush(): Promise<void> {
    if (this.items.length === 0) return;
    if (!this.online()) return;

    const batch = [...this.items];
    const result = await this.deps.sync(batch);
    const done = new Set([...result.created, ...result.duplicates]);
    this.items = this.items.filter((item) => !done.has(item.clientId));
  }
}
