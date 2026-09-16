import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SYNCED_KEY = "vestaria.lastSyncedAt";

/**
 * Just a UI timestamp for "Backed up 2 minutes ago" — not canonical domain
 * data, so AsyncStorage (not SQLite) is the right place for it.
 */
export async function getLastSyncedAt(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNCED_KEY);
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNCED_KEY, iso);
}
