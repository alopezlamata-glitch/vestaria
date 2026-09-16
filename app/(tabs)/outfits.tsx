import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { createOutfit, getOutfitWithItems, listOutfits } from "../../src/domain/outfits";
import type { OutfitWithItems } from "../../src/domain/types";
import { useTheme } from "../../src/theme";

export default function OutfitsScreen() {
  const theme = useTheme();
  const [outfits, setOutfits] = useState<OutfitWithItems[]>([]);

  const refresh = useCallback(() => {
    const withItems = listOutfits()
      .map((o) => getOutfitWithItems(o.id))
      .filter((o): o is OutfitWithItems => o !== null);
    setOutfits(withItems);
  }, []);

  useFocusEffect(refresh);

  function handleCreate() {
    const outfit = createOutfit(null);
    router.push(`/outfit/${outfit.id}`);
  }

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
        <Text style={[theme.typography.largeTitle, { color: theme.colors.textPrimary }]}>Outfits</Text>
        <Pressable
          onPress={handleCreate}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.accent,
          }}
        >
          <Text style={{ color: theme.colors.accentInverse, fontSize: 22, lineHeight: 22 }}>+</Text>
        </Pressable>
      </View>

      {outfits.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.xl }}>
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary, textAlign: "center" }]}>
            No outfits yet.
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
            Combine garments into an outfit.
          </Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
          columnWrapperStyle={{ gap: theme.spacing.md }}
          renderItem={({ item }) => <OutfitCard outfit={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function OutfitCard({ outfit }: { outfit: OutfitWithItems }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(`/outfit/${outfit.id}`)}
      style={{
        flex: 1,
        aspectRatio: 0.8,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.surfaceSecondary,
        marginBottom: theme.spacing.md,
        overflow: "hidden",
      }}
    >
      {outfit.items.slice(0, 3).map((item, index) => (
        <View
          key={item.id}
          style={{
            position: "absolute",
            left: `${10 + index * 6}%`,
            top: `${8 + index * 22}%`,
            width: "55%",
            aspectRatio: 1,
          }}
        >
          <GarmentThumb garment={item.garment} size={80} radius={theme.radii.sm} />
        </View>
      ))}
      {outfit.items.length === 0 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: theme.colors.textTertiary }}>Empty</Text>
        </View>
      )}
    </Pressable>
  );
}
