import { useMemo, useState } from "react";
import { router } from "expo-router";
import {
  FlatList,
  Pressable,
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
import { useTheme } from "../../src/theme";

const GRID_GAP = 2;
const NUM_COLUMNS = 3;

export default function ClosetScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GarmentCategory | undefined>(undefined);

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, category }),
    [search, category],
  );
  const { garments } = useGarments(filters);

  const cellSize = (width - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>Closet</Text>
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

      <FlatList
        data={CATEGORY_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item ?? "all"}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}
        style={{ flexGrow: 0, marginBottom: theme.spacing.sm }}
        renderItem={({ item }) => {
          const active = item === category;
          return (
            <Pressable
              onPress={() => setCategory(item)}
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
                style={[
                  theme.typography.secondary,
                  { color: active ? theme.colors.accentInverse : theme.colors.textSecondary },
                ]}
              >
                {item ?? "All"}
              </Text>
            </Pressable>
          );
        }}
      />

      {garments.length === 0 ? (
        <EmptyCloset />
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

function GarmentCell({ garment, size }: { garment: Garment; size: number }) {
  return (
    <Pressable onPress={() => router.push(`/garment/${garment.id}`)} accessibilityLabel={garment.name}>
      <GarmentThumb garment={garment} size={size} radius={0} />
    </Pressable>
  );
}

function EmptyCloset() {
  const theme = useTheme();
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
