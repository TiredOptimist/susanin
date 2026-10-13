import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MarkerList from "../../components/MarkerList";
import ScreenHeader from "../../components/ScreenHeader";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/config";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker } from "../../types";
import { showError } from "../../utils/alerts";

export default function MarkersScreen() {
  const { markers, isLoading, error, retryInit } = useDatabase();

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Все метки" subtitle="Загрузка..." />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && markers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Все метки" subtitle="Ошибка" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Все метки"
        subtitle={`Сохранено меток: ${markers.length}`}
      />

      <MarkerList markers={markers} onMarkerPress={handleMarkerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.giant,
  },
  errorText: { color: colors.textLight, textAlign: "center" },
});