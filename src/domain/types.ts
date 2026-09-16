export const GARMENT_CATEGORIES = [
  "tops",
  "shirts",
  "knitwear",
  "jackets",
  "coats",
  "trousers",
  "jeans",
  "shorts",
  "skirts",
  "dresses",
  "shoes",
  "bags",
  "accessories",
  "other",
] as const;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const SEMANTIC_COLORS = [
  "black",
  "white",
  "grey",
  "navy",
  "blue",
  "green",
  "beige",
  "brown",
  "red",
  "pink",
  "purple",
  "orange",
  "yellow",
  "multicolor",
] as const;
export type SemanticColor = (typeof SEMANTIC_COLORS)[number];

export interface Garment {
  id: string;
  userId: string | null;
  name: string;
  category: GarmentCategory;
  subcategory: string | null;
  primaryColor: SemanticColor;
  imageLocalUri: string | null;
  imageRemoteUrl: string | null;
  thumbLocalUri: string | null;
  thumbRemoteUrl: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  purchasePrice: number | null;
  currency: string | null;
}

export interface Outfit {
  id: string;
  userId: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitItem {
  id: string;
  outfitId: string;
  garmentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

/** An outfit together with its positioned garments, for rendering/editing. */
export interface OutfitWithItems extends Outfit {
  items: (OutfitItem & { garment: Garment })[];
}

export interface CalendarEntry {
  id: string;
  userId: string | null;
  date: string; // YYYY-MM-DD
  plannedOutfitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WearEvent {
  id: string;
  userId: string | null;
  date: string; // YYYY-MM-DD
  actualOutfitId: string | null;
  createdAt: string;
}
