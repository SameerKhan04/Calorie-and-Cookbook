import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radii, spacing } from "../theme";

type Props = {
  onContinue: (userId: string) => Promise<void>;
};

export function WelcomeScreen({ onContinue }: Props) {
  const [userId, setUserId] = useState("sam");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>Calorie & Cookbook</Text>
      <Text style={styles.lede}>
        Track energy in kJ and kcal. Log food even when lookups are offline.
      </Text>

      <Text style={styles.label}>Local user id (V1 test auth)</Text>
      <TextInput
        accessibilityLabel="User id"
        autoCapitalize="none"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
        placeholder="sam"
        placeholderTextColor={colors.inkMuted}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy || !userId.trim()}
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await onContinue(userId.trim().toLowerCase());
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not continue");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? "Starting…" : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
  brand: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  lede: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    color: colors.inkMuted,
  },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: { color: colors.rust },
});
