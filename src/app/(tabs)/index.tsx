import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MapComponent from "../../components/Map";
import ScreenHeader from "../../components/ScreenHeader";
import { colors } from "../../constants/colors";
import {
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "../../constants/config";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker } from "../../types";
import { showError } from "../../utils/alerts";

export default function HomeScreen() {
  const { markers, addMarker, isLoading, error, retryInit } = useDatabase();

  const [isNamingMarker, setIsNamingMarker] = useState(false);
  const [markerTitle, setMarkerTitle] = useState("");
  const [pendingCoordinates, setPendingCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleAddMarker = (latitude: number, longitude: number) => {
    setPendingCoordinates({ latitude, longitude });
    setMarkerTitle("");
    setIsNamingMarker(true);
  };

  const handleCreateMarker = async () => {
    if (!pendingCoordinates) return;

    const title = markerTitle.trim();

    if (!title) {
      showError("Название метки не может быть пустым.", "Введите название");
      return;
    }

    try {
      await addMarker(
        pendingCoordinates.latitude,
        pendingCoordinates.longitude,
        title
      );

      setIsNamingMarker(false);
      setMarkerTitle("");
      setPendingCoordinates(null);
    } catch (e) {
      console.error("Ошибка создания маркера:", e);
      showError("Не удалось создать метку.");
    }
  };

  const handleMarkerPress = (marker: Marker) => {
    try {
      router.push({
        pathname: "/marker/[id]",
        params: { id: String(marker.id) },
      });
    } catch (e) {
      console.error("Ошибка навигации к маркеру:", e);
      showError("Не удалось открыть информацию о метке.");
    }
  };

  if (error && markers.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Карта" subtitle="Ошибка базы данных" />
        <View style={styles.mapContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Не удалось открыть базу</Text>
            <Text style={styles.errorText}>{error.message}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={retryInit}
            >
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Карта"
        subtitle={isLoading ? "Загрузка..." : `Меток: ${markers.length}`}
      />

      <View style={styles.mapContainer}>
        <MapComponent
          markers={markers}
          onAddMarker={handleAddMarker}
          onMarkerPress={handleMarkerPress}
        />
      </View>

      {isNamingMarker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новая метка</Text>

            <Text style={styles.modalText}>Введите название места</Text>

            <TextInput
              value={markerTitle}
              onChangeText={setMarkerTitle}
              placeholder="Например: Дом"
              placeholderTextColor={colors.textMuted}
              cursorColor={colors.primaryLight}
              selectionColor={colors.primaryLight}
              style={styles.input}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsNamingMarker(false);
                  setMarkerTitle("");
                  setPendingCoordinates(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateMarker}
              >
                <Text style={styles.createButtonText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapContainer: { flex: 1 },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.giant,
  },
  modal: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radii.xxxl,
    padding: spacing.giant,
  },
  modalTitle: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  modalText: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg + 5,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundAlt,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg + 5,
    gap: spacing.lg,
  },
  cancelButton: {
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundMuted,
  },
  cancelButtonText: {
    color: colors.textMedium,
    fontWeight: fontWeight.semibold,
  },
  createButton: {
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },

  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.massive,
  },
  errorTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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