import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../constants/colors";
import { fontSize, fontWeight, radii, spacing } from "../constants/config";
import type { MarkerImage } from "../types";
import { showConfirm } from "../utils/alerts";

interface ImageListProps {
  images: MarkerImage[];
  onDelete: (imageId: number) => void;
}

export default function ImageList({ images, onDelete }: ImageListProps) {
  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Нет изображений</Text>

        <Text style={styles.emptyText}>
          Добавьте фотографию, связанную с этой меткой
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {images.map((image) => (
        <View key={image.id} style={styles.imageContainer}>
          <Image
            source={{ uri: image.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              showConfirm({
                title: "Удалить изображение?",
                message: "Это действие нельзя отменить.",
                onConfirm: () => onDelete(image.id),
              });
            }}
          >
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },

  imageContainer: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.backgroundMuted,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  deleteButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlayStrong,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: colors.white,
    fontSize: fontSize.h1,
    lineHeight: 25,
  },

  empty: {
    padding: spacing.mega,
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    borderRadius: radii.xl,
  },

  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textMedium,
  },

  emptyText: {
    marginTop: spacing.sm,
    color: colors.textTertiary,
    textAlign: "center",
    fontSize: fontSize.sm,
  },
});