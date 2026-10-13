import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  LongPressEvent,
  Marker as MapMarker,
} from "react-native-maps";

import { colors } from "../constants/colors";
import {
  config,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "../constants/config";
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
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isMapReady) {
        setMapError(
          "Не удалось загрузить карту. Проверьте соединение и попробуйте снова."
        );
      }
    }, config.map.readyTimeoutMs);

    return () => clearTimeout(timeout);
  }, [isMapReady]);

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    onAddMarker(latitude, longitude);
  };

  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Ошибка карты</Text>

        <Text style={styles.errorText}>{mapError}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setMapError(null);
            setIsMapReady(false);
          }}
        >
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={config.map.initialRegion}
        onMapReady={() => {
          setIsMapReady(true);
          setMapError(null);
        }}
        onLongPress={handleLongPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description="Нажмите, чтобы открыть"
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
        <Text style={styles.hintText}>
          Нажмите и удерживайте карту, чтобы добавить метку
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    backgroundColor: colors.overlayLight,
    paddingHorizontal: spacing.massive,
    paddingVertical: spacing.giant,
    borderRadius: radii.xxl,
    alignItems: "center",
  },

  loadingText: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.textDark,
  },

  hint: {
    position: "absolute",
    top: 55,
    left: spacing.giant,
    right: spacing.giant,
    backgroundColor: colors.overlayHint,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },

  hintText: {
    color: colors.white,
    textAlign: "center",
    fontSize: fontSize.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.massive,
    backgroundColor: colors.backgroundAlt,
  },

  errorTitle: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },

  errorText: {
    fontSize: fontSize.lg,
    textAlign: "center",
    color: colors.textLight,
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