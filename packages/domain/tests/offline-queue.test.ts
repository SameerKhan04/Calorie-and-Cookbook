import { describe, expect, it } from "vitest";
import { OfflineDiaryQueue } from "../src/offline-queue.js";

describe("OfflineDiaryQueue", () => {
  it("queues entries while offline and drains in order when online", async () => {
    const sent: string[] = [];
    const queue = new OfflineDiaryQueue({
      isOnline: () => false,
      sync: async (entries) => {
        for (const e of entries) sent.push(e.clientId);
        return { created: entries.map((e) => e.clientId), duplicates: [] };
      },
    });

    await queue.enqueue({
      clientId: "a",
      foodId: "f1",
      loggedAt: "2026-10-09T08:00:00.000Z",
      mealSlot: "breakfast",
      quantity: 1,
    });
    await queue.enqueue({
      clientId: "b",
      foodId: "f1",
      loggedAt: "2026-10-09T12:00:00.000Z",
      mealSlot: "lunch",
      quantity: 1,
    });

    expect(queue.pending()).toHaveLength(2);
    expect(sent).toHaveLength(0);

    queue.setOnline(true);
    await queue.flush();

    expect(sent).toEqual(["a", "b"]);
    expect(queue.pending()).toHaveLength(0);
  });

  it("keeps failed entries for retry", async () => {
    let attempts = 0;
    const queue = new OfflineDiaryQueue({
      isOnline: () => true,
      sync: async () => {
        attempts += 1;
        throw new Error("network");
      },
    });

    await queue.enqueue({
      clientId: "a",
      foodId: "f1",
      loggedAt: "2026-10-09T08:00:00.000Z",
      mealSlot: "breakfast",
      quantity: 1,
    });

    await expect(queue.flush()).rejects.toThrow(/network/i);
    expect(attempts).toBe(1);
    expect(queue.pending()).toHaveLength(1);
  });

  it("does not duplicate clientIds already acknowledged", async () => {
    const queue = new OfflineDiaryQueue({
      isOnline: () => true,
      sync: async (entries) => ({
        created: [],
        duplicates: entries.map((e) => e.clientId),
      }),
    });

    await queue.enqueue({
      clientId: "a",
      foodId: "f1",
      loggedAt: "2026-10-09T08:00:00.000Z",
      mealSlot: "breakfast",
      quantity: 1,
    });
    await queue.flush();
    expect(queue.pending()).toHaveLength(0);
  });
});
