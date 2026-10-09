import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "cac.authToken";
const USER_KEY = "cac.userId";

export async function loadSession(): Promise<{ userId: string; token: string } | null> {
  const [userId, token] = await Promise.all([
    AsyncStorage.getItem(USER_KEY),
    AsyncStorage.getItem(TOKEN_KEY),
  ]);
  if (!userId || !token) return null;
  return { userId, token };
}

export async function saveSession(userId: string): Promise<string> {
  const token = `test:${userId}`;
  await AsyncStorage.setItem(USER_KEY, userId);
  await AsyncStorage.setItem(TOKEN_KEY, token);
  return token;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY]);
}
