import { Ionicons } from "@expo/vector-icons"; // <-- Добавлен импорт иконки
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { LongPressEvent, Marker as MapMarker, Region } from "react-native-maps";

import { colors } from "../constants/colors";
import { fontSize, radii, spacing } from "../constants/config";
import {
  ensureLocationServicesEnabled,
  LocationError,
  requestLocationPermissions,
  startLocationUpdates,
} from "../services/location";
import { NotificationManager } from "../services/notifications";
import type { Marker } from "../types";

interface MapComponentProps {
  markers: Marker[];
  onAddMarker: (latitude: number, longitude: number) => void;
  onMarkerPress: (marker: Marker) => void;
}

export default function MapComponent({
  markers,
  onAddMarker,
  onMarkerPress,
}: MapComponentProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState<Region | undefined>(undefined);

  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);
  const isMapReadyRef = useRef(false);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const markersRef = useRef(markers);
  markersRef.current = markers;

  const notificationManagerRef = useRef<NotificationManager | null>(null);
  const locationSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const manager = new NotificationManager();
    notificationManagerRef.current = manager;

    (async () => {
      try {
        await manager.requestPermissions();
        await manager.configure();
        await manager.restorePresented();
      } catch (e) {
        console.warn("Ошибка настройки уведомлений", e);
      }
    })();

    return () => {
      locationSubscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleLocationUpdate = (loc: Location.LocationObject) => {
      if (!mounted) return;

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      console.log("GPS iOS:", coords.latitude, coords.longitude); // <-- ЛОГ ДЛЯ ОТЛАДКИ

      userLocationRef.current = coords;

      notificationManagerRef.current?.checkProximity(coords, markersRef.current);

      const newRegion: Region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (isMapReadyRef.current && !hasCenteredRef.current && mapRef.current) {
        hasCenteredRef.current = true;
        mapRef.current.animateToRegion(newRegion, 1000);
      } else if (!initialRegion) {
        setInitialRegion(newRegion);
      }
    };

    const setupLocation = async () => {
      try {
        await ensureLocationServicesEnabled();
        await requestLocationPermissions();

        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown) {
            console.log("Используем lastKnown");
            handleLocationUpdate(lastKnown);
          }
        } catch (e) {}

        try {
          const initialLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest, // <-- Изменено на Highest
          });
          handleLocationUpdate(initialLoc);
        } catch (e) {
          console.log("Текущая геопозиция пока недоступна...");
        }

        const subscription = await startLocationUpdates(handleLocationUpdate);
        locationSubscriptionRef.current = subscription;
      } catch (error) {
        if (!mounted) return;
        if (error instanceof LocationError) {
          Alert.alert("Геолокация", error.message);
        } else {
          Alert.alert("Ошибка", "Не удалось запустить отслеживание местоположения");
        }
      }
    };

    setupLocation();

    return () => {
      mounted = false;
      locationSubscriptionRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (userLocationRef.current) {
      notificationManagerRef.current?.checkProximity(userLocationRef.current, markers);
    }
  }, [markers]);

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onAddMarker(latitude, longitude);
  };

  const handleMapReady = () => {
    isMapReadyRef.current = true;
    setIsMapReady(true);
    
    if (userLocationRef.current && !hasCenteredRef.current && mapRef.current) {
      hasCenteredRef.current = true;
      mapRef.current.animateToRegion({
        latitude: userLocationRef.current.latitude,
        longitude: userLocationRef.current.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // Принудительное центрирование по кнопке
  const handleCenterMe = () => {
    if (userLocationRef.current && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocationRef.current.latitude,
        longitude: userLocationRef.current.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      Alert.alert("Геолокация", "Ожидание координат...");
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        onLongPress={handleLongPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            onPress={() => onMarkerPress(marker)}
          />
        ))}
      </MapView>

      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Загрузка карты...</Text>
          </View>
        </View>
      )}

      <View style={styles.hint}>
        <Text style={styles.hintText}>Нажмите и удерживайте карту, чтобы добавить метку</Text>
      </View>

      {/* Кнопка центрирования */}
      <TouchableOpacity style={styles.locButton} onPress={handleCenterMe}>
        <Ionicons name="locate" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
  },
  loadingBox: {
    backgroundColor: colors.overlayLight,
    paddingHorizontal: spacing.massive, paddingVertical: spacing.giant,
    borderRadius: radii.xxl, alignItems: "center",
  },
  loadingText: { marginTop: spacing.lg, fontSize: fontSize.lg, color: colors.textDark },
  hint: {
    position: "absolute", top: 55, left: spacing.giant, right: spacing.giant,
    backgroundColor: colors.overlayHint, borderRadius: radii.lg, padding: spacing.xl,
  },
  hintText: { color: colors.white, textAlign: "center", fontSize: fontSize.md },
  
  // Стиль новой кнопки
  locButton: {
    position: "absolute",
    bottom: spacing.massive,
    right: spacing.massive,
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});