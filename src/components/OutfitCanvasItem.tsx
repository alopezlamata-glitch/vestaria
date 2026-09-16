import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { GarmentThumb } from "./GarmentThumb";
import { springs } from "../theme/motion";
import type { Garment, OutfitItem } from "../domain/types";

const ITEM_SIZE = 140;

interface OutfitCanvasItemProps {
  item: OutfitItem;
  garment: Garment;
  isFront: boolean;
  onSelect: (itemId: string) => void;
  onTransformEnd: (itemId: string, transform: { x: number; y: number; scale: number }) => void;
}

export function OutfitCanvasItem({ item, garment, isFront, onSelect, onTransformEnd }: OutfitCanvasItemProps) {
  const translateX = useSharedValue(item.x);
  const translateY = useSharedValue(item.y);
  const scale = useSharedValue(item.scale);
  const startX = useSharedValue(item.x);
  const startY = useSharedValue(item.y);
  const startScale = useSharedValue(item.scale);

  useEffect(() => {
    translateX.value = item.x;
    translateY.value = item.y;
    scale.value = item.scale;
  }, [item.id]);

  function commit() {
    onTransformEnd(item.id, { x: translateX.value, y: translateY.value, scale: scale.value });
  }

  function selectHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item.id);
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(selectHaptic)();
    })
    .onChange((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onChange((e) => {
      const next = startScale.value * e.scale;
      scale.value = Math.min(Math.max(next, 0.5), 2.2);
    })
    .onEnd(() => {
      scale.value = withSpring(scale.value, springs.snappy);
      runOnJS(commit)();
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            zIndex: isFront ? 100 : item.zIndex,
          },
          style,
        ]}
      >
        <GarmentThumb garment={garment} size={ITEM_SIZE} radius={0} />
      </Animated.View>
    </GestureDetector>
  );
}
