import { useMemo } from "react";
import { router } from "expo-router";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../src/components/GarmentThumb";
import { getGarment, getGarmentsNotWornSince } from "../src/domain/garments";
import { toDateString } from "../src/domain/id";
import { getMonthlyInsights } from "../src/domain/wear";
import { useTheme } from "../src/theme";

const NOT_WORN_DAYS = 30;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function InsightsScreen() {
  const theme = useTheme();

  const { insights, mostWorn, notWorn } = useMemo(() => {
    const today = new Date();
    const start = toDateString(startOfMonth(today));
    const end = toDateString(today);
    const monthly = getMonthlyInsights(start, end);
    const topGarments = monthly.mostWornGarmentIds
      .slice(0, 6)
      .map((entry) => ({ garment: getGarment(entry.garmentId), count: entry.count }))
      .filter((entry) => entry.garment !== null);
    const rarelyWorn = getGarmentsNotWornSince(NOT_WORN_DAYS, 8);
    return { insights: monthly, mostWorn: topGarments, notWorn: rarelyWorn };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        }}
      >
        <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>History</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.colors.textSecondary }}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
        <View style={{ flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <StatTile label="Outfits worn" value={insights.outfitsWornCount} theme={theme} />
          <StatTile label="Garments worn" value={insights.garmentsWornCount} theme={theme} />
        </View>

        <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
          Most worn this month
        </Text>
        {mostWorn.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.xl }}>
            Nothing confirmed as worn yet.
          </Text>
        ) : (
          <FlatList
            data={mostWorn}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.garment!.id}
            contentContainerStyle={{ gap: theme.spacing.md, marginBottom: theme.spacing.xl }}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/garment/${item.garment!.id}`)} style={{ alignItems: "center" }}>
                <GarmentThumb garment={item.garment!} size={72} radius={theme.radii.md} />
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
                  {item.count}×
                </Text>
              </Pressable>
            )}
          />
        )}

        <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
          Not worn in {NOT_WORN_DAYS} days
        </Text>
        {notWorn.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary }}>Everything's in rotation.</Text>
        ) : (
          <FlatList
            data={notWorn}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: theme.spacing.md }}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/garment/${item.id}`)}>
                <GarmentThumb garment={item} size={72} radius={theme.radii.md} />
              </Pressable>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <View
      style={{
        flex: 1,
        padding: theme.spacing.lg,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceSecondary,
      }}
    >
      <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
