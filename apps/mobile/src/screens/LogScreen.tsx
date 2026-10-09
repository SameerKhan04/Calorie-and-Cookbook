import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OfflineDiaryQueue } from "@cac/domain";
import type { ApiClient, Food } from "../api";
import { formatEnergy } from "../format";
import { colors, radii, spacing } from "../theme";

type Props = {
  api: ApiClient;
  queue: OfflineDiaryQueue;
  onBack: () => void;
  onLogged: () => void;
};

export function LogScreen({ api, queue, onBack, onLogged }: Props) {
  const [tab, setTab] = useState<"search" | "barcode" | "custom">("search");
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [degraded, setDegraded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("250");

  async function search() {
    setMessage(null);
    const res = await api.searchFoods(query);
    setResults(res.items);
    setDegraded(Boolean(res.degraded));
  }

  async function logFood(food: Food) {
    const payload = {
      foodId: food.id,
      loggedAt: new Date().toISOString(),
      mealSlot: "lunch" as const,
      quantity: 1,
    };

    try {
      // Catalog foods need a custom copy before diary log (ownership).
      let foodId = food.id;
      if (food.source !== "custom") {
        const created = await api.createFood({
          name: food.name,
          brand: food.brand ?? null,
          barcode: food.barcode ?? null,
          servingLabel: food.servingLabel,
          servingGrams: food.servingGrams,
          caloriesKcal: food.caloriesKcal,
          proteinG: food.proteinG,
          carbsG: food.carbsG,
          fatG: food.fatG,
          bookmarked: true,
        });
        foodId = created.food.id;
      }
      await api.logDiary({ ...payload, foodId });
      onLogged();
    } catch {
      const clientId = cryptoRandom();
      await queue.enqueue({
        clientId,
        foodId: food.id,
        loggedAt: payload.loggedAt,
        mealSlot: payload.mealSlot,
        quantity: 1,
      });
      setMessage("Saved offline — will sync when the API is reachable.");
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Log food</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {(["search", "barcode", "custom"] as const).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="button"
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {degraded ? (
        <Text style={styles.warn}>Catalog offline — showing your custom foods.</Text>
      ) : null}
      {message ? <Text style={styles.warn}>{message}</Text> : null}

      {tab === "search" ? (
        <View style={styles.panel}>
          <TextInput
            accessibilityLabel="Search foods"
            value={query}
            onChangeText={setQuery}
            placeholder="Search oats, yogurt…"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            onSubmitEditing={() => void search()}
          />
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => void search()}>
            <Text style={styles.buttonText}>Search</Text>
          </Pressable>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                style={styles.row}
                onPress={() => void logFood(item)}
              >
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {item.servingLabel} · {formatEnergy(item.caloriesKcal)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {tab === "barcode" ? (
        <View style={styles.panel}>
          <TextInput
            accessibilityLabel="Barcode"
            value={barcode}
            onChangeText={setBarcode}
            placeholder="9300601001234"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            keyboardType="number-pad"
          />
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={async () => {
              setMessage(null);
              try {
                const res = await api.lookupBarcode(barcode.trim());
                await logFood(res.food);
              } catch (e) {
                setMessage(
                  e instanceof Error
                    ? e.message
                    : "Barcode not found — add a custom food instead.",
                );
              }
            }}
          >
            <Text style={styles.buttonText}>Look up & log</Text>
          </Pressable>
        </View>
      ) : null}

      {tab === "custom" ? (
        <View style={styles.panel}>
          <TextInput
            accessibilityLabel="Custom food name"
            value={customName}
            onChangeText={setCustomName}
            placeholder="Homemade meal"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
          <TextInput
            accessibilityLabel="Calories"
            value={customKcal}
            onChangeText={setCustomKcal}
            placeholder="kcal"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            keyboardType="number-pad"
          />
          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={async () => {
              const created = await api.createFood({
                name: customName,
                servingLabel: "1 serving",
                servingGrams: 100,
                caloriesKcal: Number(customKcal),
                proteinG: 10,
                carbsG: 20,
                fatG: 5,
                bookmarked: true,
              });
              await logFood(created.food);
            }}
          >
            <Text style={styles.buttonText}>Save & log</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function cryptoRandom(): string {
  // RFC4122-ish uuid for offline clientIds without extra deps.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", color: colors.ink },
  link: { color: colors.herb, fontWeight: "600" },
  tabs: { flexDirection: "row", gap: spacing.sm },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.herb, borderColor: colors.herb },
  tabText: { color: colors.inkMuted, textTransform: "capitalize" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  panel: { flex: 1, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.herb,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  rowMeta: { color: colors.inkMuted, marginTop: 2 },
  warn: { color: colors.rust },
});
