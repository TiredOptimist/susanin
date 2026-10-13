import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../constants/colors";
import { fontSize, fontWeight, radii, spacing } from "../constants/config";
import type { Marker } from "../types";

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
        <Text style={styles.emptyText}>Пока нет сохранённых меток</Text>
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
            <Text style={styles.markerIconText}>📍</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.coordinates}>
              {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
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
    padding: spacing.xxxl,
    gap: spacing.lg,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    elevation: 2,
    shadowColor: colors.shadow,
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
    borderRadius: radii.round,
    backgroundColor: colors.markerIconBg,
    justifyContent: "center",
    alignItems: "center",
  },

  markerIconText: {
    fontSize: fontSize.h2,
  },

  info: {
    flex: 1,
    marginLeft: spacing.xl,
  },

  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  coordinates: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },

  arrow: {
    fontSize: fontSize.display,
    color: colors.textMuted,
  },

  empty: {
    padding: spacing.giant,
    alignItems: "center",
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});