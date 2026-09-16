import { getDb } from "../db/client";
import { addOutfitItem, createOutfit } from "../domain/outfits";
import { createGarment } from "../domain/garments";
import { planOutfitForDate } from "../domain/calendar";
import { confirmWear } from "../domain/wear";
import { toDateString } from "../domain/id";
import { GARMENT_CATEGORIES, SEMANTIC_COLORS, type GarmentCategory, type SemanticColor } from "../domain/types";

const NAME_BY_CATEGORY: Record<GarmentCategory, string[]> = {
  tops: ["Cotton Tee", "Linen Top", "Sleeveless Top"],
  shirts: ["Oxford Shirt", "Denim Shirt", "Flannel Shirt"],
  knitwear: ["Wool Sweater", "Cable Knit", "Cashmere Jumper"],
  jackets: ["Bomber Jacket", "Denim Jacket", "Utility Jacket"],
  coats: ["Wool Coat", "Trench Coat", "Overcoat"],
  trousers: ["Tailored Trousers", "Chinos", "Wide Leg Pants"],
  jeans: ["Straight Jeans", "Slim Jeans", "Raw Denim"],
  shorts: ["Linen Shorts", "Denim Shorts", "Tailored Shorts"],
  skirts: ["Midi Skirt", "Pleated Skirt", "Denim Skirt"],
  dresses: ["Slip Dress", "Wrap Dress", "Shirt Dress"],
  shoes: ["Leather Loafers", "White Sneakers", "Chelsea Boots"],
  bags: ["Tote Bag", "Crossbody Bag", "Leather Backpack"],
  accessories: ["Wool Scarf", "Leather Belt", "Sunglasses"],
  other: ["Miscellaneous Piece"],
};

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

/** True if the wardrobe has no garments yet (fresh install). */
export function isWardrobeEmpty(): boolean {
  const db = getDb();
  const row = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM garments");
  return (row?.count ?? 0) === 0;
}

/**
 * Seeds deterministic fixture data. Pass a large `garmentCount` (500-1000)
 * to reproduce the Closet performance scenario described in the product
 * spec; the default is a small, realistic starter wardrobe.
 */
export function seedFixtures(garmentCount = 20, outfitCount = 4): void {
  const db = getDb();

  db.withTransactionSync(() => {
    const garmentIds: string[] = [];

    for (let i = 0; i < garmentCount; i++) {
      const category = pick(GARMENT_CATEGORIES, i) as GarmentCategory;
      const color = pick(SEMANTIC_COLORS, i * 3 + 1) as SemanticColor;
      const namePool = NAME_BY_CATEGORY[category];
      const name = pick(namePool, i);

      const garment = createGarment({ name, category, primaryColor: color });
      garmentIds.push(garment.id);
    }

    const outfitIds: string[] = [];
    for (let i = 0; i < outfitCount && garmentIds.length > 0; i++) {
      const outfit = createOutfit(null);
      const itemsInOutfit = Math.min(3, garmentIds.length);
      for (let j = 0; j < itemsInOutfit; j++) {
        const garmentId = garmentIds[(i * 3 + j) % garmentIds.length];
        addOutfitItem({
          outfitId: outfit.id,
          garmentId,
          x: 80 + j * 40,
          y: 60 + j * 90,
          scale: 1,
          zIndex: j,
        });
      }
      outfitIds.push(outfit.id);
    }

    if (outfitIds.length > 0) {
      const today = new Date();
      for (let daysAgo = 14; daysAgo >= -1; daysAgo--) {
        const date = new Date(today);
        date.setDate(today.getDate() - daysAgo);
        const dateString = toDateString(date);
        const outfitId = outfitIds[Math.abs(daysAgo) % outfitIds.length];

        planOutfitForDate(dateString, outfitId);
        if (daysAgo > 0) {
          confirmWear(dateString, outfitId);
        }
      }
    }
  });
}
