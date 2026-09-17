import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { migrate } from "../src/db/client";
import { isWardrobeEmpty, seedFixtures } from "../src/fixtures/seed";
import { useTheme } from "../src/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    try {
      migrate();
      if (isWardrobeEmpty()) {
        seedFixtures();
      }
    } catch (err) {
      // SQLite has no working web backend (see ARCHITECTURE.md) — on that
      // platform this is expected, and screens that don't touch the local
      // database (like Backup) should still be reachable rather than the
      // whole app going down over it.
      if (__DEV__) console.warn("Local database unavailable:", err);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="garment/[id]" options={{ presentation: "card", headerShown: true, headerTitle: "" }} />
          <Stack.Screen name="outfit/[id]" options={{ presentation: "card", headerShown: true, headerTitle: "" }} />
          <Stack.Screen name="garment/add" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="insights" options={{ presentation: "modal", headerShown: false }} />
          <Stack.Screen name="backup" options={{ presentation: "modal", headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
