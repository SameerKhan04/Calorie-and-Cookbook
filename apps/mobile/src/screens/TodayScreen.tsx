import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "../useFocusEffect";
import type { ApiClient, DayDiary, DiaryEntry } from "../api";
import { formatEnergy, formatMacroLine, todayDateString } from "../format";
import { colors, radii, spacing } from "../theme";

type Props = {
  api: ApiClient;
  onLog: () => void;
  onYou: () => void;
};

export function TodayScreen({ api, onLog, onYou }: Props) {
  const [day, setDay] = useState<DayDiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getDiary(todayDateString());
      setDay(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load diary");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(load);

  if (loading && !day) {
    return (
      <View style={styles.centered} accessibilityLabel="Loading today">
        <ActivityIndicator color={colors.herb} />
      </View>
    );
  }

  if (error && !day) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={load} style={styles.secondary}>
          <Text style={styles.secondaryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!day) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Pressable accessibilityRole="button" onPress={onYou}>
          <Text style={styles.link}>You</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Remaining</Text>
        <Text style={styles.heroValue}>{formatEnergy(day.remaining.caloriesKcal)}</Text>
        <Text style={styles.macros}>
          {formatMacroLine(
            day.remaining.proteinG,
            day.remaining.carbsG,
            day.remaining.fatG,
          )}
        </Text>
        <Text style={styles.nextMeal}>
          Next meal budget ≈ {formatEnergy(day.nextMealBudgetKcal)}
        </Text>
      </View>

      <Pressable accessibilityRole="button" style={styles.logButton} onPress={onLog}>
        <Text style={styles.logButtonText}>Log food</Text>
      </Pressable>

      {day.entries.length === 0 ? (
        <View style={styles.empty} accessibilityRole="summary">
          <Text style={styles.emptyTitle}>No meals logged</Text>
          <Text style={styles.emptyBody}>
            Search, scan a barcode, or add a custom food to start your day.
          </Text>
        </View>
      ) : (
        <FlatList
          data={day.entries}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.herb} />
          }
          renderItem={({ item }) => (
            <EntryRow
              entry={item}
              onDelete={async () => {
                await api.deleteDiary(item.id);
                await load();
              }}
            />
          )}
        />
      )}
    </View>
  );
}

function EntryRow({
  entry,
  onDelete,
}: {
  entry: DiaryEntry;
  onDelete: () => Promise<void>;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{entry.foodName}</Text>
        <Text style={styles.rowMeta}>
          {entry.mealSlot} · ×{entry.quantity} · {formatEnergy(entry.caloriesKcal)}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${entry.foodName}`} onPress={onDelete}>
        <Text style={styles.delete}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg, gap: spacing.md },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink },
  link: { color: colors.herb, fontWeight: "600", fontSize: 16 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroLabel: { color: colors.inkMuted, fontSize: 13 },
  heroValue: { fontSize: 28, fontWeight: "700", color: colors.ink },
  macros: { color: colors.inkMuted },
  nextMeal: { marginTop: spacing.sm, color: colors.herb, fontWeight: "600" },
  logButton: {
    backgroundColor: colors.herb,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  empty: { paddingVertical: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.ink },
  emptyBody: { color: colors.inkMuted, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.md,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  rowMeta: { color: colors.inkMuted, marginTop: 2 },
  delete: { color: colors.rust, fontWeight: "600" },
  error: { color: colors.rust, textAlign: "center" },
  secondary: {
    borderWidth: 1,
    borderColor: colors.herb,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  secondaryText: { color: colors.herb, fontWeight: "600" },
});
