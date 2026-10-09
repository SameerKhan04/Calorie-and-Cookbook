import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createStubCatalog } from "./services/food-catalog.js";

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:8081")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = createApp({
  catalog: createStubCatalog([
    {
      id: "seed-oats",
      name: "Rolled oats",
      brand: "Coles",
      barcode: "9300601001234",
      servingLabel: "40 g",
      servingGrams: 40,
      caloriesKcal: 150,
      proteinG: 5,
      carbsG: 27,
      fatG: 3,
      source: "open_food_facts",
    },
  ]),
  allowedOrigins,
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});
