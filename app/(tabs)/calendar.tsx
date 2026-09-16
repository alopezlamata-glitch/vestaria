import { useCallback, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { listCalendarEntries, movePlannedOutfit, planOutfitForDate } from "../../src/domain/calendar";
import { getOutfitWithItems, listOutfits } from "../../src/domain/outfits";
import { toDateString } from "../../src/domain/id";
import type { CalendarEntry, OutfitWithItems } from "../../src/domain/types";
import { useTheme } from "../../src/theme";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const theme = useTheme();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({});
  const [outfitsById, setOutfitsById] = useState<Record<string, OutfitWithItems>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [moveSourceDate, setMoveSourceDate] = useState<string | null>(null);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const refresh = useCallback(() => {
    const start = toDateString(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    const end = toDateString(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
    const list = listCalendarEntries(start, end);
    const byDate: Record<string, CalendarEntry> = {};
    const outfitCache: Record<string, OutfitWithItems> = {};
    for (const entry of list) {
      byDate[entry.date] = entry;
      if (entry.plannedOutfitId && !outfitCache[entry.plannedOutfitId]) {
        const outfit = getOutfitWithItems(entry.plannedOutfitId);
        if (outfit) outfitCache[entry.plannedOutfitId] = outfit;
      }
    }
    setEntries(byDate);
    setOutfitsById(outfitCache);
  }, [cursor]);

  useFocusEffect(refresh);

  const todayString = toDateString(today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} hitSlop={12}>
          <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>‹</Text>
        </Pressable>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} hitSlop={12}>
          <Text style={{ fontSize: 20, color: theme.colors.textSecondary }}>›</Text>
        </Pressable>
      </View>

      {moveSourceDate && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surfaceSecondary,
          }}
        >
          <Text style={[theme.typography.secondary, { color: theme.colors.textPrimary }]}>
            Tap a day to move this outfit there
          </Text>
          <Pressable onPress={() => setMoveSourceDate(null)}>
            <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection: "row", paddingHorizontal: theme.spacing.lg }}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={i}
            style={{ flex: 1, textAlign: "center", color: theme.colors.textTertiary, fontSize: 12 }}
          >
            {label}
          </Text>
        ))}
      </View>

      <FlatList
        data={grid}
        keyExtractor={(_, i) => String(i)}
        numColumns={7}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xs }}
        renderItem={({ item: date }) => {
          if (!date) return <View style={{ flex: 1, aspectRatio: 0.8 }} />;
          const dateString = toDateString(date);
          const entry = entries[dateString];
          const outfit = entry?.plannedOutfitId ? outfitsById[entry.plannedOutfitId] : undefined;
          const isToday = dateString === todayString;
          const isMoveSource = dateString === moveSourceDate;

          function handlePress() {
            if (moveSourceDate) {
              if (moveSourceDate !== dateString) {
                movePlannedOutfit(moveSourceDate, dateString);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refresh();
              }
              setMoveSourceDate(null);
              return;
            }
            setSelectedDate(dateString);
          }

          function handleLongPress() {
            if (!entry?.plannedOutfitId) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setMoveSourceDate(dateString);
          }

          return (
            <Pressable
              onPress={handlePress}
              onLongPress={handleLongPress}
              delayLongPress={350}
              style={{
                flex: 1,
                aspectRatio: 0.8,
                alignItems: "center",
                paddingTop: theme.spacing.xs,
                opacity: isMoveSource ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  marginBottom: 4,
                  color: isToday ? theme.colors.accent : theme.colors.textSecondary,
                  fontWeight: isToday ? "700" : "400",
                }}
              >
                {date.getDate()}
              </Text>
              {outfit?.items[0] ? (
                <GarmentThumb garment={outfit.items[0].garment} size={34} radius={theme.radii.sm} />
              ) : (
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: theme.radii.sm,
                    backgroundColor: theme.colors.surfaceSecondary,
                  }}
                />
              )}
            </Pressable>
          );
        }}
      />

      <DayPlannerSheet
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onPlanned={() => {
          setSelectedDate(null);
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

function DayPlannerSheet({
  date,
  onClose,
  onPlanned,
}: {
  date: string | null;
  onClose: () => void;
  onPlanned: () => void;
}) {
  const theme = useTheme();
  const outfits = date ? listOutfits() : [];

  return (
    <Modal visible={!!date} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: theme.colors.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radii.xl,
          borderTopRightRadius: theme.radii.xl,
          padding: theme.spacing.lg,
          maxHeight: "60%",
        }}
      >
        <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.md }]}>
          Plan for {date}
        </Text>
        {outfits.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary }}>Create an outfit first.</Text>
        ) : (
          <FlatList
            data={outfits}
            keyExtractor={(o) => o.id}
            horizontal
            contentContainerStyle={{ gap: theme.spacing.sm }}
            renderItem={({ item }) => {
              const withItems = getOutfitWithItems(item.id);
              return (
                <Pressable
                  onPress={() => {
                    if (date) planOutfitForDate(date, item.id);
                    onPlanned();
                  }}
                  style={{
                    width: 90,
                    height: 110,
                    borderRadius: theme.radii.md,
                    backgroundColor: theme.colors.surfaceSecondary,
                    overflow: "hidden",
                  }}
                >
                  {withItems?.items[0] && <GarmentThumb garment={withItems.items[0].garment} size={90} radius={0} />}
                </Pressable>
              );
            }}
          />
        )}
        <Pressable
          onPress={() => {
            if (date) planOutfitForDate(date, null);
            onPlanned();
          }}
          style={{ marginTop: theme.spacing.md, alignItems: "center" }}
        >
          <Text style={{ color: theme.colors.danger }}>Clear day</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
