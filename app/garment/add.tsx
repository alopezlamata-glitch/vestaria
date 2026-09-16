import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";

import { createGarment, updateGarmentImages } from "../../src/domain/garments";
import { processGarmentPhoto } from "../../src/imaging/pipeline";
import { useTheme } from "../../src/theme";

/**
 * The critical add-garment flow: capture/pick -> garment exists immediately
 * (optimistic insert with the raw photo) -> heavier processing happens after
 * navigation, silently swapping in the normalized image + thumbnail.
 */
export default function AddGarmentScreen() {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  async function handlePick(source: "camera" | "library") {
    if (busy) return;

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Vestaria needs access to continue.");
      return;
    }

    setBusy(true);
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 1 });

    if (result.canceled || !result.assets?.[0]) {
      setBusy(false);
      return;
    }

    const rawUri = result.assets[0].uri;

    // 1. Optimistic insert: the garment exists now, using the raw photo.
    const garment = createGarment({
      name: "New Item",
      category: "other",
      primaryColor: "multicolor",
      imageLocalUri: rawUri,
      thumbLocalUri: rawUri,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(`/garment/${garment.id}`);

    // 2. Silent background processing: swap in the normalized crop + thumb.
    processGarmentPhoto(rawUri, garment.id)
      .then((processed) => updateGarmentImages(garment.id, processed))
      .catch(() => {
        // Processing failed; the raw photo remains visible, nothing blocks the user.
      });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "flex-end" }}>
      <View
        style={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radii.xl,
          borderTopRightRadius: theme.radii.xl,
        }}
      >
        <Text
          style={[
            theme.typography.headline,
            { color: theme.colors.textPrimary, textAlign: "center", marginBottom: theme.spacing.sm },
          ]}
        >
          Add garment
        </Text>

        <Pressable
          disabled={busy}
          onPress={() => handlePick("camera")}
          style={{
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radii.md,
            alignItems: "center",
            backgroundColor: theme.colors.accent,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.colors.accentInverse, fontWeight: "600" }}>Take Photo</Text>
        </Pressable>

        <Pressable
          disabled={busy}
          onPress={() => handlePick("library")}
          style={{
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radii.md,
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>Choose from Library</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ paddingVertical: theme.spacing.md, alignItems: "center" }}>
          <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
