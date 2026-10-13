import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { colors } from "../constants/colors";
import {
  config,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "../constants/config";
import type { Marker } from "../types";
import { buildMapHtml } from "./mapTemplate";

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

  // Актуальные маркеры для handleMessage (без замыкания)
  const markersRef = useRef(markers);
  markersRef.current = markers;

  // HTML один раз
  const html = useMemo(() => buildMapHtml(), []);

  // Таймаут загрузки
  useEffect(() => {
    if (isMapReady || mapError) return;

    const timer = setTimeout(() => {
      setMapError(true);
    }, config.map.readyTimeoutMs);

    return () => clearTimeout(timer);
  }, [isMapReady, mapError, reloadKey]);

  // Автоскрытие подсказки
  useEffect(() => {
    if (!isMapReady) return;

    const timer = setTimeout(() => setShowHint(false), HINT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isMapReady]);

  // Обновление маркеров (diff внутри JS)
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

    webViewRef.current?.injectJavaScript(
      `window.updateMarkers(${markerData}); true;`
    );
  }, [markers, isMapReady]);

  const handleRetry = () => {
    setMapError(false);
    setIsMapReady(false);
    setShowHint(true);
    setReloadKey((k) => k + 1);
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        setIsMapReady(true);
        setMapError(false);
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
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        ) {
          setShowHint(false);
          onAddMarker(latitude, longitude);
        }
        return;
      }

      if (message.type === "markerPress") {
        const marker = markersRef.current.find(
          (item) => item.id === Number(message.id)
        );

        if (marker) {
          onMarkerPress(marker);
        }
      }
    } catch (error) {
      console.warn("Ошибка сообщения карты:", error);
    }
  };

  if (mapError) {
    return (
      <View style={styles.message}>
        <Text style={styles.errorTitle}>Не удалось загрузить карту</Text>
        <Text style={styles.errorText}>
          Проверьте подключение к интернету и попробуйте снова.
        </Text>
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
          <Text style={styles.hintText}>
            Нажмите и удерживайте карту, чтобы добавить метку
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    flex: 1,
    backgroundColor: colors.backgroundMap,
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundAlt,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textDark,
  },
  hint: {
    position: "absolute",
    top: 55,
    left: spacing.giant,
    right: spacing.giant,
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  hintText: {
    color: colors.white,
    textAlign: "center",
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.massive,
    backgroundColor: colors.backgroundAlt,
  },
  errorTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.giant,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.massive,
    paddingVertical: spacing.xl,
    borderRadius: radii.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
});