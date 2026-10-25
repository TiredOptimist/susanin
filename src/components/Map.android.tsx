import { Ionicons } from "@expo/vector-icons"; // <-- Добавлен импорт иконки
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "../constants/colors";
import { config, fontSize, fontWeight, radii, spacing } from "../constants/config";
import type { Marker } from "../types";
import { buildMapHtml } from "./mapTemplate";

import {
  ensureLocationServicesEnabled,
  LocationError,
  requestLocationPermissions,
  startLocationUpdates,
} from "../services/location";
import { NotificationManager } from "../services/notifications";

interface MapComponentProps {
  markers: Marker[];
  onAddMarker: (latitude: number, longitude: number) => void;
  onMarkerPress: (marker: Marker) => void;
}

const HINT_TIMEOUT_MS = 6000;

export default function MapComponent({
  markers,
  onAddMarker,
  onMarkerPress,
}: MapComponentProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const webViewRef = useRef<WebView>(null);

  const markersRef = useRef(markers);
  markersRef.current = markers;

  const notificationManagerRef = useRef<NotificationManager | null>(null);
  const locationSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  const hasCenteredRef = useRef(false);
  const isMapReadyRef = useRef(false);

  const html = useMemo(() => buildMapHtml(), []);

  useEffect(() => {
    let mounted = true;

    const manager = new NotificationManager();
    notificationManagerRef.current = manager;

    const initializeNotifications = async () => {
  try {
    await manager.configure();
  } catch {
    
  }

  if (!mounted) return;

  const granted = await manager.requestPermissions();

  console.log(
    "[Notifications] Разрешение выдано:",
    granted
  );

  if (granted && mounted) {
    await manager.restorePresented();
  }
};

    void initializeNotifications();

    return () => {
      mounted = false;

      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = null;

      notificationManagerRef.current = null;
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
      console.log("GPS Android:", coords.latitude, coords.longitude); // <-- ЛОГ ДЛЯ ОТЛАДКИ

      userLocationRef.current = coords;

      notificationManagerRef.current?.checkProximity(coords, markersRef.current);

      if (isMapReadyRef.current && !hasCenteredRef.current) {
        hasCenteredRef.current = true;
        webViewRef.current?.injectJavaScript(`
          if (window.centerOnUser) { window.centerOnUser(${coords.latitude}, ${coords.longitude}, 16); }
          true;
        `);
      }

      webViewRef.current?.injectJavaScript(`
        if (window.setUserLocation) { window.setUserLocation(${coords.latitude}, ${coords.longitude}); }
        true;
      `);
    };

    const setupLocation = async () => {
      try {
        await ensureLocationServicesEnabled();
        await requestLocationPermissions();

        // 1. Мгновенно проверяем последнюю известную
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown) {
            console.log("Используем lastKnown");
            handleLocationUpdate(lastKnown);
          }
        } catch (e) {}

        // 2. Запрашиваем текущую с высокой точностью
        try {
          const initialLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest, // <-- Изменено на Highest
          });
          handleLocationUpdate(initialLoc);
        } catch (e) {
          console.log("Текущая геопозиция пока недоступна, ждем watchPositionAsync...");
        }

        // 3. Постоянное отслеживание
        const subscription = await startLocationUpdates(handleLocationUpdate);

        if (!mounted) {
          subscription.remove();
          return;
        }
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
      locationSubscriptionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (userLocationRef.current) {
      notificationManagerRef.current?.checkProximity(userLocationRef.current, markers);
    }
  }, [markers]);

  useEffect(() => {
    if (isMapReady || mapError) return;
    const timer = setTimeout(() => setMapError(true), config.map.readyTimeoutMs);
    return () => clearTimeout(timer);
  }, [isMapReady, mapError, reloadKey]);

  useEffect(() => {
    if (!isMapReady) return;
    const timer = setTimeout(() => setShowHint(false), HINT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;

    const markerData = JSON.stringify(
      markers.map((marker) => ({
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        title: marker.title,
      }))
    ).replace(/</g, "\\u003c");

    webViewRef.current?.injectJavaScript(`window.updateMarkers(${markerData}); true;`);
  }, [markers, isMapReady]);

  const handleRetry = () => {
    setMapError(false);
    setIsMapReady(false);
    setShowHint(true);
    hasCenteredRef.current = false;
    isMapReadyRef.current = false;
    setReloadKey((k) => k + 1);
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        isMapReadyRef.current = true;
        setIsMapReady(true);
        setMapError(false);
        
        if (userLocationRef.current && !hasCenteredRef.current) {
          hasCenteredRef.current = true;
          const { latitude, longitude } = userLocationRef.current;
          webViewRef.current?.injectJavaScript(`
            if (window.centerOnUser) { window.centerOnUser(${latitude}, ${longitude}, 16); }
            true;
          `);
        }
        return;
      }

      if (message.type === "error") {
        console.warn("Ошибка карты:", message.message);
        setMapError(true);
        return;
      }

      if (message.type === "addMarker") {
        const latitude = Number(message.latitude);
        const longitude = Number(message.longitude);

        if (
          Number.isFinite(latitude) && Number.isFinite(longitude) &&
          latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
        ) {
          setShowHint(false);
          onAddMarker(latitude, longitude);
        }
        return;
      }

      if (message.type === "markerPress") {
        const marker = markersRef.current.find((item) => item.id === Number(message.id));
        if (marker) onMarkerPress(marker);
      }
    } catch (error) {
      console.warn("Ошибка сообщения карты:", error);
    }
  };

  // Принудительное центрирование по кнопке
  const handleCenterMe = () => {
    if (userLocationRef.current) {
      const { latitude, longitude } = userLocationRef.current;
      webViewRef.current?.injectJavaScript(`
        if (window.centerOnUser) { window.centerOnUser(${latitude}, ${longitude}, 16); }
        true;
      `);
    } else {
      Alert.alert("Геолокация", "Ожидание координат...");
    }
  };

  if (mapError) {
    return (
      <View style={styles.message}>
        <Text style={styles.errorTitle}>Не удалось загрузить карту</Text>
        <Text style={styles.errorText}>Проверьте подключение к интернету и попробуйте снова.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ html }}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={(e) => {
          console.warn("Ошибка WebView:", e.nativeEvent);
          setMapError(true);
        }}
      />

      {!isMapReady && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </View>
      )}

      {showHint && (
        <View pointerEvents="none" style={styles.hint}>
          <Text style={styles.hintText}>Нажмите и удерживайте карту, чтобы добавить метку</Text>
        </View>
      )}

      {/* Кнопка центрирования */}
      <TouchableOpacity style={styles.locButton} onPress={handleCenterMe}>
        <Ionicons name="locate" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: colors.backgroundMap },
  loading: {
    position: "absolute",
    top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.backgroundAlt,
  },
  loadingText: { marginTop: spacing.lg, color: colors.textDark },
  hint: {
    position: "absolute", top: 55, left: spacing.giant, right: spacing.giant,
    alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.primaryLight,
  },
  hintText: { color: colors.white, textAlign: "center", fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  message: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: spacing.massive, backgroundColor: colors.backgroundAlt,
  },
  errorTitle: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: "center" },
  errorText: { marginTop: spacing.md, color: colors.textLight, textAlign: "center", marginBottom: spacing.giant },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.massive, paddingVertical: spacing.xl, borderRadius: radii.md },
  retryButtonText: { color: colors.white, fontWeight: fontWeight.semibold },
  
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