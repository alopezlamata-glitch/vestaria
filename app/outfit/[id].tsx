import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GarmentThumb } from "../../src/components/GarmentThumb";
import { OutfitCanvasItem } from "../../src/components/OutfitCanvasItem";
import { listGarments } from "../../src/domain/garments";
import {
  addOutfitItem,
  duplicateOutfit,
  getOutfitWithItems,
  removeOutfitItem,
  updateOutfitItemTransform,
} from "../../src/domain/outfits";
import type { Garment, OutfitWithItems } from "../../src/domain/types";
import { useTheme } from "../../src/theme";

export default function OutfitEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [outfit, setOutfit] = useState<OutfitWithItems | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = useCallback(() => {
    setOutfit(getOutfitWithItems(id));
  }, [id]);

  useFocusEffect(refresh);

  if (!outfit) return null;

  function handleTransformEnd(itemId: string, transform: { x: number; y: number; scale: number }) {
    updateOutfitItemTransform(itemId, transform);
    refresh();
  }

  function handleAddGarment(garment: Garment) {
    const nextZ = Math.max(0, ...outfit!.items.map((i) => i.zIndex)) + 1;
    addOutfitItem({ outfitId: id, garmentId: garment.id, x: 100, y: 140, zIndex: nextZ });
    setPickerOpen(false);
    refresh();
  }

  function handleRemoveSelected() {
    if (!selectedId) return;
    removeOutfitItem(selectedId);
    setSelectedId(null);
    refresh();
  }

  function handleDuplicate() {
    const copy = duplicateOutfit(id);
    if (copy) router.replace(`/outfit/${copy.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.colors.textSecondary }}>Done</Text>
        </Pressable>
        <View style={{ flexDirection: "row", gap: theme.spacing.lg }}>
          <Pressable onPress={handleDuplicate}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>Duplicate</Text>
          </Pressable>
          <Pressable onPress={() => setPickerOpen(true)}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>Add</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={{ flex: 1 }} onPress={() => setSelectedId(null)}>
        {outfit.items.map((item) => (
          <OutfitCanvasItem
            key={item.id}
            item={item}
            garment={item.garment}
            isFront={item.id === selectedId}
            onSelect={setSelectedId}
            onTransformEnd={handleTransformEnd}
          />
        ))}
        {outfit.items.length === 0 && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: theme.colors.textTertiary }}>Tap "Add" to bring in garments.</Text>
          </View>
        )}
      </Pressable>

      {selectedId && (
        <View style={{ padding: theme.spacing.lg }}>
          <Pressable
            onPress={handleRemoveSelected}
            style={{
              alignSelf: "center",
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radii.full,
              backgroundColor: theme.colors.surfaceSecondary,
            }}
          >
            <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>Remove garment</Text>
          </Pressable>
        </View>
      )}

      <GarmentPickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handleAddGarment} />
    </SafeAreaView>
  );
}

function GarmentPickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (garment: Garment) => void;
}) {
  const theme = useTheme();
  const garments = visible ? listGarments() : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.md,
          }}
        >
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>Add garment</Text>
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.colors.textSecondary }}>Close</Text>
          </Pressable>
        </View>
        <FlatList
          data={garments}
          keyExtractor={(g) => g.id}
          numColumns={3}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: 2 }}
          columnWrapperStyle={{ gap: 2 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item)}>
              <GarmentThumb garment={item} size={110} radius={0} />
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
