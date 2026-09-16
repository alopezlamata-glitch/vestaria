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

/**
 * The `garments` table as stored in Postgres — no `image_local_uri` /
 * `thumb_local_uri`, since a device-local file path is meaningless on
 * another device (see product spec §11: cloud gets the normalized asset,
 * not device paths).
 */
export interface RemoteGarmentRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  subcategory: string | null;
  primary_color: string;
  image_remote_url: string | null;
  thumb_remote_url: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  purchase_price: number | null;
  currency: string | null;
}

export function garmentToRemoteRow(garment: Garment, userId: string): RemoteGarmentRow {
  return {
    id: garment.id,
    user_id: userId,
    name: garment.name,
    category: garment.category,
    subcategory: garment.subcategory,
    primary_color: garment.primaryColor,
    image_remote_url: garment.imageRemoteUrl,
    thumb_remote_url: garment.thumbRemoteUrl,
    created_at: garment.createdAt,
    updated_at: garment.updatedAt,
    archived_at: garment.archivedAt,
    purchase_price: garment.purchasePrice,
    currency: garment.currency,
  };
}

/** A remote row pulled down has no local file paths yet — those get filled in by re-download, not here. */
export function garmentFromRemoteRow(row: RemoteGarmentRow): Garment {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as GarmentCategory,
    subcategory: row.subcategory,
    primaryColor: row.primary_color as SemanticColor,
    imageLocalUri: null,
    imageRemoteUrl: row.image_remote_url,
    thumbLocalUri: null,
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

export function outfitToRow(outfit: Outfit, userId: string): OutfitRow {
  return {
    id: outfit.id,
    user_id: userId,
    name: outfit.name,
    created_at: outfit.createdAt,
    updated_at: outfit.updatedAt,
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

export function outfitItemToRow(item: OutfitItem): OutfitItemRow {
  return {
    id: item.id,
    outfit_id: item.outfitId,
    garment_id: item.garmentId,
    x: item.x,
    y: item.y,
    scale: item.scale,
    rotation: item.rotation,
    z_index: item.zIndex,
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

export function calendarEntryToRow(entry: CalendarEntry, userId: string): CalendarEntryRow {
  return {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    planned_outfit_id: entry.plannedOutfitId,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
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

export function wearEventToRow(event: WearEvent, userId: string): WearEventRow {
  return {
    id: event.id,
    user_id: userId,
    date: event.date,
    actual_outfit_id: event.actualOutfitId,
    created_at: event.createdAt,
  };
}
