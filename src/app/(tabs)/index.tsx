import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MapComponent from "../../components/Map";
import ScreenHeader from "../../components/ScreenHeader";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker } from "../../types";

export default function HomeScreen() {
  const { markers, addMarker, isLoading, error } = useDatabase();

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
      Alert.alert("Введите название", "Название метки не может быть пустым.");
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
      Alert.alert("Ошибка", "Не удалось создать метку.");
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
      Alert.alert("Ошибка", "Не удалось открыть информацию о метке.");
    }
  };

  // Общая ошибка БД (инициализации) — покажем грубо, но наглядно
  if (error && markers.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Карта" subtitle="Ошибка базы данных" />
        <View style={styles.mapContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Не удалось открыть базу</Text>
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Карта"
        subtitle={
          isLoading ? "Загрузка..." : `Меток: ${markers.length}`
        }
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
  container: { flex: 1, backgroundColor: "#fff" },
  mapContainer: { flex: 1 },

  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#222" },
  modalText: { marginTop: 6, marginBottom: 15, color: "#777" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  cancelButtonText: { color: "#444", fontWeight: "600" },
  createButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#208AEF",
  },
  createButtonText: { color: "#fff", fontWeight: "600" },

  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  errorText: { marginTop: 8, color: "#666", textAlign: "center" },
});