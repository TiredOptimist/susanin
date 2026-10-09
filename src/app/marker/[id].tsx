import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ImageList from "../../components/ImageList";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker, MarkerImage } from "../../types";

export default function MarkerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const markerId = Number(id);

  const {
    isLoading: isDbLoading,
    getMarker,
    loadMarker,
    getMarkerImages,
    addImage,
    deleteImage,
    deleteMarker,
  } = useDatabase();

  const [marker, setMarker] = useState<Marker | undefined>(undefined);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const reloadImages = useCallback(async () => {
    try {
      const list = await getMarkerImages(markerId);
      setImages(list);
    } catch (e) {
      console.error("Не удалось перезагрузить изображения:", e);
    }
  }, [getMarkerImages, markerId]);

  // Загружаем метку и изображения, когда БД готова
  useEffect(() => {
    if (isDbLoading) return;

    if (!Number.isFinite(markerId)) {
      setIsScreenLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // 1) Сначала пробуем из локального состояния
        let m = getMarker(markerId);

        // 2) Если нет — идём в БД (например, открыли экран после перезапуска)
        if (!m) {
          m = (await loadMarker(markerId)) ?? undefined;
        }

        if (mounted) setMarker(m);

        const list = await getMarkerImages(markerId);
        if (mounted) setImages(list);
      } catch (e) {
        console.error("Ошибка загрузки данных метки:", e);
      } finally {
        if (mounted) setIsScreenLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isDbLoading, markerId, getMarker, loadMarker, getMarkerImages]);

  const handleBack = () => {
    try {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e) {
      console.error("Ошибка возврата:", e);
      Alert.alert("Ошибка", "Не удалось вернуться назад.");
    }
  };

  const handleDeleteMarker = () => {
    if (!marker) return;

    Alert.alert(
      "Удалить метку?",
      `Метка «${marker.title}» и связанные с ней изображения будут удалены.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMarker(markerId);
              router.replace("/");
            } catch (e) {
              console.error("Ошибка удаления метки:", e);
              Alert.alert("Ошибка", "Не удалось удалить метку.");
            }
          },
        },
      ]
    );
  };

  const handleAddImage = async () => {
    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Нет доступа",
          "Разрешите приложению доступ к фотографиям в настройках устройства."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (result.canceled) return;

      for (const asset of result.assets) {
        await addImage(markerId, asset.uri);
      }

      await reloadImages();
    } catch (e) {
      console.error("Ошибка выбора изображения:", e);
      Alert.alert("Ошибка", "Не удалось выбрать изображение. Попробуйте ещё раз.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage(imageId);
      await reloadImages();
    } catch (e) {
      console.error("Ошибка удаления изображения:", e);
      Alert.alert("Ошибка", "Не удалось удалить изображение.");
    }
  };

  if (isScreenLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!marker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Метка не найдена</Text>
          <Text style={styles.notFoundText}>
            Возможно, она была удалена или имеет некорректный идентификатор.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Вернуться к карте</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(marker.createdAt).toLocaleString("ru-RU");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={handleBack}>
          <Text style={styles.backText}>‹ Назад</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{marker.title}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Информация о местоположении</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Широта</Text>
            <Text style={styles.value}>{marker.latitude.toFixed(6)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Долгота</Text>
            <Text style={styles.value}>{marker.longitude.toFixed(6)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Создано</Text>
            <Text style={styles.value}>{formattedDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteMarkerButton}
          onPress={handleDeleteMarker}
        >
          <Text style={styles.deleteMarkerText}>Удалить метку</Text>
        </TouchableOpacity>

        <View style={styles.imagesHeader}>
          <View>
            <Text style={styles.sectionTitle}>Изображения</Text>
            <Text style={styles.imageCount}>Добавлено: {images.length}</Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, isPickingImage && styles.addButtonDisabled]}
            onPress={handleAddImage}
            disabled={isPickingImage}
          >
            {isPickingImage ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addButtonText}>+ Добавить</Text>
            )}
          </TouchableOpacity>
        </View>

        <ImageList images={images} onDelete={handleDeleteImage} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },

  back: { alignSelf: "flex-start", paddingVertical: 8, marginBottom: 10 },
  backText: { color: "#208AEF", fontSize: 17, fontWeight: "600" },

  title: { fontSize: 28, fontWeight: "700", color: "#222", marginBottom: 20 },

  infoCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
  },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: "#222" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  label: { color: "#777", fontSize: 14 },
  value: { color: "#222", fontSize: 14, fontWeight: "500", maxWidth: "60%", textAlign: "right" },

  imagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  imageCount: { marginTop: 4, color: "#888", fontSize: 13 },

  addButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: "center",
  },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  notFound: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  notFoundTitle: { fontSize: 24, fontWeight: "700", color: "#222", marginBottom: 10 },
  notFoundText: { color: "#777", textAlign: "center", lineHeight: 21, marginBottom: 25 },
  backButton: {
    backgroundColor: "#208AEF",
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
  },
  backButtonText: { color: "#fff", fontWeight: "600" },

  deleteMarkerButton: {
    marginBottom: 28,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FFE5E5",
    alignItems: "center",
  },
  deleteMarkerText: { color: "#D32F2F", fontSize: 15, fontWeight: "600" },
});