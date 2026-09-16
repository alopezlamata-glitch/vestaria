import type {
  CalendarEntry,
  Garment,
  GarmentCategory,
  Outfit,
  OutfitItem,
  SemanticColor,
  WearEvent,
} from "../domain/types";

export interface GarmentRow {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  subcategory: string | null;
  primary_color: string;
  image_local_uri: string | null;
  image_remote_url: string | null;
  thumb_local_uri: string | null;
  thumb_remote_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  purchase_price: number | null;
  currency: string | null;
}

export function garmentFromRow(row: GarmentRow): Garment {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as GarmentCategory,
    subcategory: row.subcategory,
    primaryColor: row.primary_color as SemanticColor,
    imageLocalUri: row.image_local_uri,
    imageRemoteUrl: row.image_remote_url,
    thumbLocalUri: row.thumb_local_uri,
    thumbRemoteUrl: row.thumb_remote_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    purchasePrice: row.purchase_price,
    currency: row.currency,
  };
}

export interface OutfitRow {
  id: string;
  user_id: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export function outfitFromRow(row: OutfitRow): Outfit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface OutfitItemRow {
  id: string;
  outfit_id: string;
  garment_id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z_index: number;
}

export function outfitItemFromRow(row: OutfitItemRow): OutfitItem {
  return {
    id: row.id,
    outfitId: row.outfit_id,
    garmentId: row.garment_id,
    x: row.x,
    y: row.y,
    scale: row.scale,
    rotation: row.rotation,
    zIndex: row.z_index,
  };
}

export interface CalendarEntryRow {
  id: string;
  user_id: string | null;
  date: string;
  planned_outfit_id: string | null;
  created_at: string;
  updated_at: string;
}

export function calendarEntryFromRow(row: CalendarEntryRow): CalendarEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    plannedOutfitId: row.planned_outfit_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface WearEventRow {
  id: string;
  user_id: string | null;
  date: string;
  actual_outfit_id: string | null;
  created_at: string;
}

export function wearEventFromRow(row: WearEventRow): WearEvent {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    actualOutfitId: row.actual_outfit_id,
    createdAt: row.created_at,
  };
}
