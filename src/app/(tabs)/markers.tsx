import { router } from "expo-router";
import {
  SafeAreaView,
  StyleSheet
} from "react-native";

import type { Marker } from "../../../types";
import MarkerList from "../../components/MarkerList";
import ScreenHeader from "../../components/ScreenHeader";
import { useMarkers } from "../../context/MarkerContext";

export default function MarkersScreen() {
  const { markers } = useMarkers();

  const handleMarkerPress = (marker: Marker) => {
    router.push({
      pathname: "/marker/[id]",
      params: {
        id: String(marker.id),
      },
    });
  };

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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  }
});