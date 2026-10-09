import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ApiClient } from "../api";
import { formatEnergy } from "../format";
import { colors, radii, spacing } from "../theme";

type Props = {
  api: ApiClient;
  onBack: () => void;
  onSignOut: () => Promise<void>;
};

export function YouScreen({ api, onBack, onSignOut }: Props) {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const data = await api.getProfile();
      setName(String(data.profile.displayName ?? ""));
      setCalories(String(data.targets.caloriesKcal));
      setProtein(String(data.targets.proteinG));
      setCarbs(String(data.targets.carbsG));
      setFat(String(data.targets.fatG));
    })();
  }, [api]);

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.link}>Back to Today</Text>
      </Pressable>
      <Text style={styles.title}>You</Text>
      <Text style={styles.lede}>Update profile details and manual macro targets.</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput
        accessibilityLabel="Display name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        style={styles.secondary}
        onPress={async () => {
          await api.updateProfile({ displayName: name });
          setMessage("Profile updated");
        }}
      >
        <Text style={styles.secondaryText}>Save profile</Text>
      </Pressable>

      <Text style={styles.section}>Manual targets</Text>
      <Text style={styles.hint}>
        Current target preview: {calories ? formatEnergy(Number(calories)) : "—"}
      </Text>
      <TextInput accessibilityLabel="Calorie target" value={calories} onChangeText={setCalories} style={styles.input} keyboardType="number-pad" />
      <TextInput accessibilityLabel="Protein target" value={protein} onChangeText={setProtein} style={styles.input} keyboardType="number-pad" />
      <TextInput accessibilityLabel="Carb target" value={carbs} onChangeText={setCarbs} style={styles.input} keyboardType="number-pad" />
      <TextInput accessibilityLabel="Fat target" value={fat} onChangeText={setFat} style={styles.input} keyboardType="number-pad" />

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={async () => {
          await api.putTargets({
            caloriesKcal: Number(calories),
            proteinG: Number(protein),
            carbsG: Number(carbs),
            fatG: Number(fat),
          });
          setMessage("Targets saved");
        }}
      >
        <Text style={styles.buttonText}>Save targets</Text>
      </Pressable>

      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    gap: spacing.sm,
    flexGrow: 1,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.ink, marginTop: spacing.sm },
  lede: { color: colors.inkMuted, marginBottom: spacing.md },
  label: { color: colors.inkMuted, fontSize: 13 },
  section: { marginTop: spacing.lg, fontSize: 18, fontWeight: "700", color: colors.ink },
  hint: { color: colors.inkMuted },
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
  buttonText: { color: "#fff", fontWeight: "600" },
  secondary: {
    borderWidth: 1,
    borderColor: colors.herb,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: colors.herb, fontWeight: "600" },
  link: { color: colors.herb, fontWeight: "600" },
  ok: { color: colors.herb },
  signOut: { marginTop: spacing.xl, alignItems: "center" },
  signOutText: { color: colors.rust, fontWeight: "600" },
});
