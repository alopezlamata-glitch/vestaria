import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { garmentSwatch } from "../theme/garmentColors";
import { radii } from "../theme/radii";
import type { Garment } from "../domain/types";

interface GarmentThumbProps {
  garment: Pick<Garment, "thumbLocalUri" | "imageLocalUri" | "primaryColor" | "category">;
  size?: number;
  radius?: number;
}

/**
 * Renders a garment's thumbnail, falling back to a flat color swatch when no
 * photo has been captured yet (e.g. freshly seeded fixture data).
 */
export function GarmentThumb({ garment, size = 96, radius = radii.md }: GarmentThumbProps) {
  const uri = garment.thumbLocalUri ?? garment.imageLocalUri;

  if (uri) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: garmentSwatch[garment.primaryColor], overflow: "hidden" }}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={120}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.swatch,
        { width: size, height: size, borderRadius: radius, backgroundColor: garmentSwatch[garment.primaryColor] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  swatch: {
    alignItems: "center",
    justifyContent: "center",
  },
});
