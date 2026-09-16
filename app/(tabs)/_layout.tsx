import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";

import { useTheme } from "../../src/theme";

function TabIcon({ symbol, focused, color }: { symbol: string; focused: boolean; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color, opacity: focused ? 1 : 0.6 }}>{symbol}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: theme.typography.caption.fontWeight },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ focused, color }) => <TabIcon symbol="☀" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: "Closet",
          tabBarIcon: ({ focused, color }) => <TabIcon symbol="▢" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: "Outfits",
          tabBarIcon: ({ focused, color }) => <TabIcon symbol="◇" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused, color }) => <TabIcon symbol="▦" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
