import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ImageList from "../../components/ImageList";
import { colors } from "../../constants/colors";
import {
  config,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "../../constants/config";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { Marker, MarkerImage } from "../../types";
import { showConfirm, showError } from "../../utils/alerts";

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

  useEffect(() => {
    if (isDbLoading) return;

    if (!Number.isFinite(markerId)) {
      setIsScreenLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        let m = getMarker(markerId);

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
      showError("Не удалось вернуться назад.");
    }
  };

  const handleDeleteMarker = () => {
    if (!marker) return;

    showConfirm({
      title: "Удалить метку?",
      message: `Метка «${marker.title}» и связанные с ней изображения будут удалены.`,
      onConfirm: async () => {
        try {
          await deleteMarker(markerId);
          router.replace("/");
        } catch (e) {
          console.error("Ошибка удаления метки:", e);
          showError("Не удалось удалить метку.");
        }
      },
    });
  };

  const handleAddImage = async () => {
    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError(
          "Разрешите приложению доступ к фотографиям в настройках устройства.",
          "Нет доступа"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: config.imagePicker.quality,
        selectionLimit: config.imagePicker.selectionLimit,
      });

      if (result.canceled) return;

      for (const asset of result.assets) {
        await addImage(markerId, asset.uri);
      }

      await reloadImages();
    } catch (e) {
      console.error("Ошибка выбора изображения:", e);
      showError("Не удалось выбрать изображение. Попробуйте ещё раз.");
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
      showError("Не удалось удалить изображение.");
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
            style={[
              styles.addButton,
              isPickingImage && styles.addButtonDisabled,
            ]}
            onPress={handleAddImage}
            disabled={isPickingImage}
          >
            {isPickingImage ? (
              <ActivityIndicator color={colors.white} size="small" />
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
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.giant,
    paddingBottom: spacing.ultra,
  },

  back: {
    alignSelf: "flex-start",
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.primary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
  },

  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.giant,
  },

  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.xxl,
    padding: spacing.huge,
    marginBottom: spacing.colossal,
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: { color: colors.textSecondary, fontSize: fontSize.md },
  value: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    maxWidth: "60%",
    textAlign: "right",
  },

  imagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  imageCount: {
    marginTop: spacing.xs,
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    minWidth: 110,
    alignItems: "center",
  },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.mega,
  },
  notFoundTitle: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  notFoundText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.massive + 1,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.xl + 1,
    borderRadius: radii.md,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },

  deleteMarkerButton: {
    marginBottom: spacing.colossal,
    paddingVertical: spacing.xxl,
    borderRadius: radii.md,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
  },
  deleteMarkerText: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});