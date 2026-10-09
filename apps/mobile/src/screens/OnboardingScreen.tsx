import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ApiClient } from "../api";
import { colors, radii, spacing } from "../theme";

type Props = {
  api: ApiClient;
  onDone: () => Promise<void>;
};

export function OnboardingScreen({ api, onDone }: Props) {
  const [displayName, setDisplayName] = useState("Sam");
  const [ageYears, setAgeYears] = useState("28");
  const [heightCm, setHeightCm] = useState("178");
  const [weightKg, setWeightKg] = useState("82");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.title}>Set up your targets</Text>
      <Text style={styles.lede}>
        We suggest calories and macros from your details. You can override them later.
      </Text>

      <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
      <Field label="Age" value={ageYears} onChangeText={setAgeYears} keyboardType="number-pad" />
      <Field label="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="decimal-pad" />
      <Field label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        style={styles.button}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await api.onboard({
              displayName,
              sex: "male",
              ageYears: Number(ageYears),
              heightCm: Number(heightCm),
              weightKg: Number(weightKg),
              activity: "moderate",
              goal: "lose",
              mealsPerDay: 3,
              units: "metric",
              dietTags: [],
              preferredRetailers: ["woolworths"],
              aiPhotoConsent: false,
            });
            await onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Onboarding failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? "Saving…" : "Create my plan"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType ?? "default"}
        style={styles.input}
        placeholderTextColor={colors.inkMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    gap: spacing.md,
    flexGrow: 1,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink },
  lede: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  field: { gap: spacing.xs },
  label: { fontSize: 13, color: colors.inkMuted },
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
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  error: { color: colors.rust },
});
