import type * as SQLite from 'expo-sqlite';

import type { Marker, MarkerImage } from '../types';

export type MarkerRow = {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  created_at: string;
};

export type MarkerImageRow = {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
};

function rowToMarker(row: MarkerRow): Marker {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    title: row.title,
    createdAt: row.created_at,
  };
}

function rowToMarkerImage(row: MarkerImageRow): MarkerImage {
  return {
    id: row.id,
    markerId: row.marker_id,
    uri: row.uri,
    createdAt: row.created_at,
  };
}

export async function fetchMarkers(
  db: SQLite.SQLiteDatabase
): Promise<Marker[]> {
  const rows = await db.getAllAsync<MarkerRow>(
    'SELECT * FROM markers ORDER BY created_at DESC'
  );

  return rows.map(rowToMarker);
}

export async function fetchMarkerById(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Marker | null> {
  const row = await db.getFirstAsync<MarkerRow>(
    'SELECT * FROM markers WHERE id = ? LIMIT 1',
    id
  );

  return row ? rowToMarker(row) : null;
}

export async function createMarker(
  db: SQLite.SQLiteDatabase,
  latitude: number,
  longitude: number,
  title: string
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO markers (latitude, longitude, title)
     VALUES (?, ?, ?)`,
    latitude,
    longitude,
    title
  );

  if (__DEV__) {
    console.log(`[DB] createMarker id=${result.lastInsertRowId}`);
  }

  return result.lastInsertRowId;
}

export async function deleteMarker(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM marker_images WHERE marker_id = ?',
      id
    );
    await db.runAsync(
      'DELETE FROM markers WHERE id = ?',
      id
    );
  });

  if (__DEV__) {
    console.log(`[DB] deleteMarker id=${id}`);
  }
}

export async function fetchMarkerImages(
  db: SQLite.SQLiteDatabase,
  markerId: number
): Promise<MarkerImage[]> {
  const rows = await db.getAllAsync<MarkerImageRow>(
    `SELECT * FROM marker_images
     WHERE marker_id = ?
     ORDER BY created_at DESC`,
    markerId
  );

  return rows.map(rowToMarkerImage);
}

export async function createImage(
  db: SQLite.SQLiteDatabase,
  markerId: number,
  uri: string
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO marker_images (marker_id, uri)
     VALUES (?, ?)`,
    markerId,
    uri
  );

  if (__DEV__) {
    console.log(`[DB] createImage id=${result.lastInsertRowId} marker=${markerId}`);
  }

  return result.lastInsertRowId;
}

export async function deleteImage(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    'DELETE FROM marker_images WHERE id = ?',
    id
  );

  if (__DEV__) {
    console.log(`[DB] deleteImage id=${id}`);
  }
}