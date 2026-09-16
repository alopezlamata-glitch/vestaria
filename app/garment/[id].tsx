import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { archiveGarment, getGarment, getGarmentLastWorn, getGarmentWearCount } from "../../src/domain/garments";
import { listOutfits, getOutfitWithItems } from "../../src/domain/outfits";
import { useTheme } from "../../src/theme";

export default function GarmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  const garment = useMemo(() => getGarment(id), [id, refreshKey]);
  const wearCount = useMemo(() => (garment ? getGarmentWearCount(garment.id) : 0), [garment, refreshKey]);
  const lastWorn = useMemo(() => (garment ? getGarmentLastWorn(garment.id) : null), [garment, refreshKey]);

  const outfitsContaining = useMemo(() => {
    if (!garment) return [];
    return listOutfits()
      .map((o) => getOutfitWithItems(o.id))
      .filter((o) => o?.items.some((item) => item.garmentId === garment.id));
  }, [garment, refreshKey]);

  if (!garment) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.textSecondary }}>Garment not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}>
      <View style={{ alignItems: "center", paddingTop: theme.spacing.md }}>
        <GarmentThumb garment={garment} size={280} radius={theme.radii.lg} />
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl }}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>{garment.name}</Text>
        <Text style={[theme.typography.secondary, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
          {wearCount === 0 ? "Never worn" : `Worn ${wearCount} time${wearCount === 1 ? "" : "s"}`}
          {lastWorn ? ` · Last worn ${lastWorn}` : ""}
        </Text>

        {outfitsContaining.length > 0 && (
          <View style={{ marginTop: theme.spacing.xl }}>
            <Text style={[theme.typography.headline, { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }]}>
              Outfits
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                {outfitsContaining.map(
                  (outfit) =>
                    outfit && (
                      <Pressable
                        key={outfit.id}
                        onPress={() => router.push(`/outfit/${outfit.id}`)}
                        style={{
                          width: 90,
                          height: 110,
                          borderRadius: theme.radii.md,
                          backgroundColor: theme.colors.surfaceSecondary,
                          overflow: "hidden",
                        }}
                      >
                        {outfit.items[0] && <GarmentThumb garment={outfit.items[0].garment} size={90} radius={0} />}
                      </Pressable>
                    ),
                )}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={{ marginTop: theme.spacing.xxl, gap: theme.spacing.sm }}>
          <Pressable
            onPress={() =>
              Alert.alert("Archive garment", `Move "${garment.name}" to archive?`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Archive",
                  style: "destructive",
                  onPress: () => {
                    archiveGarment(garment.id);
                    router.back();
                  },
                },
              ])
            }
            style={{
              paddingVertical: theme.spacing.md,
              borderRadius: theme.radii.md,
              alignItems: "center",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>Archive</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
