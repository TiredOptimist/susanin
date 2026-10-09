import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import type { Marker } from "../../types";

interface MarkerListProps {
  markers: Marker[];
  onMarkerPress: (marker: Marker) => void;
}

export default function MarkerList({
  markers,
  onMarkerPress,
}: MarkerListProps) {
  if (markers.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Пока нет сохранённых меток
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={markers}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => onMarkerPress(item)}
        >
          <View style={styles.markerIcon}>
            <Text style={styles.markerIconText}>
              📍
            </Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.title}>
              {item.title}
            </Text>

            <Text style={styles.coordinates}>
              {item.latitude.toFixed(5)},{" "}
              {item.longitude.toFixed(5)}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  markerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  markerIconText: {
    fontSize: 22,
  },

  info: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  coordinates: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },

  arrow: {
    fontSize: 28,
    color: "#999",
  },

  empty: {
    padding: 20,
    alignItems: "center",
  },

  emptyText: {
    color: "#777",
    fontSize: 14,
  },
});