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

import type { Marker } from "../../types";

interface MapComponentProps {
  markers: Marker[];
  onAddMarker: (
    latitude: number,
    longitude: number
  ) => void;
  onMarkerPress: (marker: Marker) => void;
}

const INITIAL_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

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
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isMapReady]);

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } =
      event.nativeEvent.coordinate;

    onAddMarker(latitude, longitude);
  };

  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Ошибка карты
        </Text>

        <Text style={styles.errorText}>
          {mapError}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setMapError(null);
            setIsMapReady(false);
          }}
        >
          <Text style={styles.retryButtonText}>
            Повторить
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
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
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Загрузка карты...
            </Text>
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
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },

  hint: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    padding: 12,
  },

  hintText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#222",
  },

  errorText: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});