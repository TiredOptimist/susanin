import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import type { MarkerImage } from "../../types";

interface ImageListProps {
  images: MarkerImage[];
  onDelete: (imageId: number) => void;
}

export default function ImageList({
  images,
  onDelete,
}: ImageListProps) {
  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          Нет изображений
        </Text>

        <Text style={styles.emptyText}>
          Добавьте фотографию, связанную с этой меткой
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {images.map((image) => (
        <View
          key={image.id}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: image.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Удалить изображение?",
                "Это действие нельзя отменить.",
                [
                  {
                    text: "Отмена",
                    style: "cancel",
                  },
                  {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => onDelete(image.id),
                  },
                ]
              );
            }}
          >
            <Text style={styles.deleteText}>
              ×
            </Text>
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
    gap: 10,
  },

  imageContainer: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 25,
  },

  empty: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },

  emptyText: {
    marginTop: 6,
    color: "#888",
    textAlign: "center",
    fontSize: 13,
  },
});