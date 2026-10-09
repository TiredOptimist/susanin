import * as SQLite from 'expo-sqlite';
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    createImage as createImageOp,
    createMarker as createMarkerOp,
    deleteImage as deleteImageOp,
    deleteMarker as deleteMarkerOp,
    fetchMarkerById,
    fetchMarkerImages,
    fetchMarkers,
} from '../database/operations';
import { initDatabase } from '../database/schema';
import type { Marker, MarkerImage } from '../types';

interface DatabaseContextType {
  markers: Marker[];
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;

  addMarker: (
    latitude: number,
    longitude: number,
    title: string
  ) => Promise<Marker>;

  deleteMarker: (id: number) => Promise<void>;

  getMarker: (id: number) => Marker | undefined;

  loadMarker: (id: number) => Promise<Marker | null>;

  addImage: (markerId: number, uri: string) => Promise<MarkerImage>;

  deleteImage: (id: number) => Promise<void>;

  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined
);

export function DatabaseProvider({ children }: PropsWithChildren) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      try {
        if (__DEV__) {
          console.log('[DB] Открытие базы данных markers.db');
        }

        const database = await SQLite.openDatabaseAsync('markers.db');

        await initDatabase(database);

        const list = await fetchMarkers(database);

        if (!isMountedRef.current) return;

        setDb(database);
        setMarkers(list);
        setError(null);

        if (__DEV__) {
          console.log(`[DB] Загружено маркеров: ${list.length}`);
        }
      } catch (e) {
        console.error('[DB] Ошибка инициализации:', e);

        if (isMountedRef.current) {
          setError(
            e instanceof Error
              ? e
              : new Error('Не удалось инициализировать базу данных')
          );
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runSafely = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        const result = await fn();
        if (isMountedRef.current) setError(null);
        return result;
      } catch (e) {
        console.error('[DB] Ошибка операции:', e);

        const normalized =
          e instanceof Error ? e : new Error('Ошибка базы данных');

        if (isMountedRef.current) setError(normalized);
        throw normalized;
      }
    },
    []
  );

  const addMarker = useCallback(
    async (latitude: number, longitude: number, title: string) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      return runSafely(async () => {
        const id = await createMarkerOp(db, latitude, longitude, title);

        const newMarker: Marker = {
          id,
          latitude,
          longitude,
          title,
          createdAt: new Date().toISOString(),
        };

        if (isMountedRef.current) {
          setMarkers((prev) => [newMarker, ...prev]);
        }

        return newMarker;
      });
    },
    [db, runSafely]
  );

  const deleteMarker = useCallback(
    async (id: number) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      await runSafely(async () => {
        await deleteMarkerOp(db, id);

        if (isMountedRef.current) {
          setMarkers((prev) => prev.filter((m) => m.id !== id));
        }
      });
    },
    [db, runSafely]
  );

  const getMarker = useCallback(
    (id: number) => markers.find((marker) => marker.id === id),
    [markers]
  );

  const loadMarker = useCallback(
    async (id: number) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      return runSafely(() => fetchMarkerById(db, id));
    },
    [db, runSafely]
  );

  const addImage = useCallback(
    async (markerId: number, uri: string) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      return runSafely(async () => {
        const id = await createImageOp(db, markerId, uri);

        const newImage: MarkerImage = {
          id,
          markerId,
          uri,
          createdAt: new Date().toISOString(),
        };

        return newImage;
      });
    },
    [db, runSafely]
  );

  const deleteImage = useCallback(
    async (id: number) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      await runSafely(() => deleteImageOp(db, id));
    },
    [db, runSafely]
  );

  const getMarkerImages = useCallback(
    async (markerId: number) => {
      if (!db) {
        throw new Error('База данных ещё не готова');
      }

      return runSafely(() => fetchMarkerImages(db, markerId));
    },
    [db, runSafely]
  );

  const clearError = useCallback(() => {
    if (isMountedRef.current) setError(null);
  }, []);

  const value = useMemo<DatabaseContextType>(
    () => ({
      markers,
      isLoading,
      error,
      clearError,
      addMarker,
      deleteMarker,
      getMarker,
      loadMarker,
      addImage,
      deleteImage,
      getMarkerImages,
    }),
    [
      markers,
      isLoading,
      error,
      clearError,
      addMarker,
      deleteMarker,
      getMarker,
      loadMarker,
      addImage,
      deleteImage,
      getMarkerImages,
    ]
  );

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error(
      'useDatabase должен использоваться внутри DatabaseProvider'
    );
  }

  return context;
}