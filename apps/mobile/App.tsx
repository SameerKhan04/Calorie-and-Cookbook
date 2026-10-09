import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { OfflineDiaryQueue } from "@cac/domain";
import { ApiClient } from "./src/api";
import { clearSession, loadSession, saveSession } from "./src/session";
import { LogScreen } from "./src/screens/LogScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { YouScreen } from "./src/screens/YouScreen";
import { colors } from "./src/theme";

type Screen = "boot" | "welcome" | "onboarding" | "today" | "log" | "you";

export default function App() {
  const [screen, setScreen] = useState<Screen>("boot");
  const tokenRef = useRef<string | null>(null);

  const api = useMemo(
    () =>
      new ApiClient({
        baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787",
        getToken: () => tokenRef.current,
      }),
    [],
  );

  const queue = useMemo(
    () =>
      new OfflineDiaryQueue({
        isOnline: () => true,
        sync: async (entries) => api.syncDiary(entries),
      }),
    [api],
  );

  useEffect(() => {
    void (async () => {
      const session = await loadSession();
      if (!session) {
        setScreen("welcome");
        return;
      }
      tokenRef.current = session.token;
      try {
        await api.getProfile();
        setScreen("today");
      } catch (e) {
        const status = (e as { status?: number }).status;
        setScreen(status === 404 ? "onboarding" : "welcome");
      }
    })();
  }, [api]);

  if (screen === "boot") {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.herb} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {screen === "welcome" ? (
        <WelcomeScreen
          onContinue={async (userId) => {
            tokenRef.current = await saveSession(userId);
            try {
              await api.getProfile();
              setScreen("today");
            } catch (e) {
              const status = (e as { status?: number }).status;
              if (status === 404) setScreen("onboarding");
              else throw e;
            }
          }}
        />
      ) : null}
      {screen === "onboarding" ? (
        <OnboardingScreen
          api={api}
          onDone={async () => {
            setScreen("today");
          }}
        />
      ) : null}
      {screen === "today" ? (
        <TodayScreen
          api={api}
          onLog={() => setScreen("log")}
          onYou={() => setScreen("you")}
        />
      ) : null}
      {screen === "log" ? (
        <LogScreen
          api={api}
          queue={queue}
          onBack={() => setScreen("today")}
          onLogged={() => setScreen("today")}
        />
      ) : null}
      {screen === "you" ? (
        <YouScreen
          api={api}
          onBack={() => setScreen("today")}
          onSignOut={async () => {
            await clearSession();
            tokenRef.current = null;
            setScreen("welcome");
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
});
