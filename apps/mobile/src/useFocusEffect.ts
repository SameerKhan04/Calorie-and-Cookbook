import { useEffect } from "react";

/** Tiny stand-in until Expo Router focus events are wired. */
export function useFocusEffect(effect: () => void | Promise<void>) {
  useEffect(() => {
    void effect();
  }, [effect]);
}
