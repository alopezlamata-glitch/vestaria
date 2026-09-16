import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const DISPLAY_MAX_DIMENSION = 1024;
const THUMB_MAX_DIMENSION = 256;

export interface ProcessedGarmentImage {
  imageLocalUri: string;
  thumbLocalUri: string;
}

/**
 * On-device image pipeline: orientation-correct + resize + compress the
 * capture, generate a small thumbnail for grid rendering, and persist both
 * under the app's document directory so they survive independent of the
 * camera roll / cache.
 *
 * NOTE: background removal (Vision / ML Kit) is not wired up yet — that
 * needs a native module beyond what Expo's JS APIs expose. Garments are
 * stored as normalized crops for now; see ARCHITECTURE.md.
 */
export async function processGarmentPhoto(sourceUri: string, garmentId: string): Promise<ProcessedGarmentImage> {
  const dir = new Directory(Paths.document, "garments", garmentId);
  if (!dir.exists) dir.create({ intermediates: true });

  const display = await manipulateAsync(sourceUri, [{ resize: { width: DISPLAY_MAX_DIMENSION } }], {
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  const thumb = await manipulateAsync(sourceUri, [{ resize: { width: THUMB_MAX_DIMENSION } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  const imageFile = new File(dir, "image.jpg");
  const thumbFile = new File(dir, "thumb.jpg");
  if (imageFile.exists) imageFile.delete();
  if (thumbFile.exists) thumbFile.delete();
  await new File(display.uri).copy(imageFile);
  await new File(thumb.uri).copy(thumbFile);

  return { imageLocalUri: imageFile.uri, thumbLocalUri: thumbFile.uri };
}
