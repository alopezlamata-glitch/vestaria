import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { GARMENT_CATEGORIES, type Garment, type GarmentCategory } from "../../src/domain/types";
import { useGarments } from "../../src/hooks/useGarments";
import { seedFixtures } from "../../src/fixtures/seed";
import { useTheme } from "../../src/theme";

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const NOT_WORN_DAYS = 30;

export default function ClosetScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GarmentCategory | undefined>(undefined);
  const [notWornOnly, setNotWornOnly] = useState(false);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      category,
      notWornInDays: notWornOnly ? NOT_WORN_DAYS : undefined,
    }),
    [search, category, notWornOnly],
  );
  const { garments, refresh } = useGarments(filters);

  const cellSize = (width - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  function handleDevSeed() {
    if (!__DEV__) return;
    Alert.alert("Load performance fixture?", "Seeds 500 garments to test Closet scroll performance.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Seed 500",
        onPress: () => {
          seedFixtures(500, 40);
          refresh();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Pressable onLongPress={handleDevSeed} delayLongPress={800}>
          <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>Closet</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/garment/add")}
          hitSlop={8}
          style={[styles.addButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={{ color: theme.colors.accentInverse, fontSize: 22, lineHeight: 22 }}>+</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search garments"
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.search,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              color: theme.colors.textPrimary,
              borderRadius: theme.radii.md,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}
        style={{ flexGrow: 0, marginBottom: theme.spacing.sm }}
      >
        <Chip
          label="Not worn"
          active={notWornOnly}
          onPress={() => {
            Haptics.selectionAsync();
            setNotWornOnly((v) => !v);
          }}
        />
        {CATEGORY_FILTERS.map((item) => (
          <Chip key={item ?? "all"} label={item ?? "All"} active={item === category} onPress={() => setCategory(item)} />
        ))}
      </ScrollView>

      {garments.length === 0 ? (
        <EmptyCloset filtered={!!search.trim() || !!category || notWornOnly} />
      ) : (
        <FlatList
          data={garments}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          initialNumToRender={24}
          windowSize={7}
          maxToRenderPerBatch={18}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: cellSize,
            offset: Math.floor(index / NUM_COLUMNS) * (cellSize + GRID_GAP),
            index,
          })}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{ gap: GRID_GAP, paddingBottom: theme.spacing.xxl }}
          renderItem={({ item }) => <GarmentCell garment={item} size={cellSize} />}
        />
      )}
    </SafeAreaView>
  );
}

const CATEGORY_FILTERS: (GarmentCategory | undefined)[] = [undefined, ...GARMENT_CATEGORIES];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.surfaceSecondary,
          borderRadius: theme.radii.full,
          paddingHorizontal: theme.spacing.md,
        },
      ]}
    >
      <Text
        style={[theme.typography.secondary, { color: active ? theme.colors.accentInverse : theme.colors.textSecondary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function GarmentCell({ garment, size }: { garment: Garment; size: number }) {
  return (
    <Pressable onPress={() => router.push(`/garment/${garment.id}`)} accessibilityLabel={garment.name}>
      <GarmentThumb garment={garment} size={size} radius={0} />
    </Pressable>
  );
}

function EmptyCloset({ filtered }: { filtered: boolean }) {
  const theme = useTheme();

  if (filtered) {
    return (
      <View style={[styles.empty, { paddingHorizontal: theme.spacing.xl }]}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>
          No matches.
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: "center", marginTop: theme.spacing.sm },
          ]}
        >
          Try a different search or filter.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.empty, { paddingHorizontal: theme.spacing.xl }]}>
      <Text style={[theme.typography.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>
        Your closet starts here.
      </Text>
      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textSecondary, textAlign: "center", marginTop: theme.spacing.sm },
        ]}
      >
        Add your first piece.
      </Text>
      <Pressable
        onPress={() => router.push("/garment/add")}
        style={[
          styles.emptyButton,
          { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, marginTop: theme.spacing.xl },
        ]}
      >
        <Text style={{ color: theme.colors.accentInverse, fontWeight: "600" }}>Add garment</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  search: { height: 40 },
  chip: { height: 32, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12 },
});
