import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { getCalendarEntry } from "../../src/domain/calendar";
import { toDateString } from "../../src/domain/id";
import { getOutfitWithItems } from "../../src/domain/outfits";
import type { OutfitWithItems } from "../../src/domain/types";
import { confirmWear, getWearEvent, undoWear } from "../../src/domain/wear";
import { useTheme } from "../../src/theme";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

export default function TodayScreen() {
  const theme = useTheme();
  const [todayOutfit, setTodayOutfit] = useState<OutfitWithItems | null>(null);
  const [tomorrowOutfit, setTomorrowOutfit] = useState<OutfitWithItems | null>(null);
  const [worn, setWorn] = useState(false);

  const todayString = toDateString(new Date());
  const tomorrowString = toDateString(addDays(new Date(), 1));

  const refresh = useCallback(() => {
    const todayEntry = getCalendarEntry(todayString);
    const outfit = todayEntry?.plannedOutfitId ? getOutfitWithItems(todayEntry.plannedOutfitId) : null;
    setTodayOutfit(outfit);

    const tomorrowEntry = getCalendarEntry(tomorrowString);
    const tOutfit = tomorrowEntry?.plannedOutfitId ? getOutfitWithItems(tomorrowEntry.plannedOutfitId) : null;
    setTomorrowOutfit(tOutfit);

    const wearEvent = getWearEvent(todayString);
    setWorn(!!wearEvent?.actualOutfitId);
  }, [todayString, tomorrowString]);

  useFocusEffect(refresh);

  function handleWoreIt() {
    if (!todayOutfit) return;
    if (worn) {
      undoWear(todayString);
      setWorn(false);
    } else {
      confirmWear(todayString, todayOutfit.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setWorn(true);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
        }}
      >
        <View>
          <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary }]}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>Today</Text>
        </View>
        <Pressable onPress={() => router.push("/insights")} hitSlop={8} style={{ paddingBottom: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.textSecondary }}>History</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.lg }}>
        {todayOutfit ? (
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => router.push(`/outfit/${todayOutfit.id}`)}
              style={{
                flex: 1,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.surfaceSecondary,
                overflow: "hidden",
              }}
            >
              {todayOutfit.items.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: `${10 + index * 8}%`,
                    top: `${6 + index * 24}%`,
                    width: "60%",
                    aspectRatio: 1,
                  }}
                >
                  <GarmentThumb garment={item.garment} size={160} radius={theme.radii.md} />
                </View>
              ))}
            </Pressable>

            <Pressable
              onPress={handleWoreIt}
              style={{
                marginTop: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
                borderRadius: theme.radii.md,
                alignItems: "center",
                backgroundColor: worn ? theme.colors.surfaceSecondary : theme.colors.accent,
              }}
            >
              <Text
                style={{
                  color: worn ? theme.colors.textPrimary : theme.colors.accentInverse,
                  fontWeight: "600",
                }}
              >
                {worn ? "Worn ✓" : "Wore it"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={[theme.typography.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>
              Nothing planned yet.
            </Text>
            <Pressable onPress={() => router.push("/calendar")} style={{ marginTop: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.accent, fontWeight: "600" }}>Plan today's outfit</Text>
            </Pressable>
          </View>
        )}
      </View>

      {tomorrowOutfit && (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
          }}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginBottom: theme.spacing.sm }]}>
            TOMORROW
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {tomorrowOutfit.items.slice(0, 4).map((item) => (
              <GarmentThumb key={item.id} garment={item.garment} size={48} radius={theme.radii.sm} />
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
