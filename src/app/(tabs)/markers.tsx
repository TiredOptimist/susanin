import { router } from "expo-router";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import MarkerList from "../../components/MarkerList";
import ScreenHeader from "../../components/ScreenHeader";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker } from "../../types";

export default function MarkersScreen() {
  const { markers, isLoading, error } = useDatabase();

  const handleMarkerPress = (marker: Marker) => {
    router.push({
      pathname: "/marker/[id]",
      params: { id: String(marker.id) },
    });
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

      <MarkerList
        markers={markers}
        onMarkerPress={handleMarkerPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#666", textAlign: "center" },
});