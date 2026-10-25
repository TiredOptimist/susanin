
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Marker } from "../types";
import { calculateDistance } from "../utils/geo";

export const PROXIMITY_THRESHOLD_METERS = 100;
export const EXIT_THRESHOLD_METERS = 150;

const CHANNEL_ID = "marker-proximity-v2"; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ActiveNotification {
  markerId: number;
  notificationId: string;
  timestamp: number;
}

export class NotificationManager {
  private static activeNotifications = new Map<
    number,
    ActiveNotification
  >();

  private static queue: Promise<void> = Promise.resolve();

  async configure(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Уведомления о метках",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 150, 250],
    });

    console.log("[Notifications] Android-канал настроен");
  } catch  {
    
  }
}

  async requestPermissions(): Promise<boolean> {
    try {
      const current = await Notifications.getPermissionsAsync();

      if (current.granted) {
        return true;
      }

      const result = await Notifications.requestPermissionsAsync();
      return result.granted;
    } catch (error) {
      console.warn("Ошибка разрешений уведомлений:", error);
      return false;
    }
  }

  async checkProximity(
    userLocation: { latitude: number; longitude: number },
    markers: Marker[]
  ): Promise<void> {
    NotificationManager.queue = NotificationManager.queue
      .then(() => this.processProximity(userLocation, markers))
      .catch((error) => {
        console.warn("Ошибка проверки близости:", error);
      });

    return NotificationManager.queue;
  }

  private async processProximity(
    userLocation: { latitude: number; longitude: number },
    markers: Marker[]
  ): Promise<void> {
    const markerIds = new Set(markers.map((marker) => marker.id));

    // Убираем уведомления для удалённых меток.
    for (const markerId of NotificationManager.activeNotifications.keys()) {
      if (!markerIds.has(markerId)) {
        await this.remove(markerId);
      }
    }

    for (const marker of markers) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        marker.latitude,
        marker.longitude
      );

      if (distance <= PROXIMITY_THRESHOLD_METERS) {
        await this.show(marker);
      } else if (distance > EXIT_THRESHOLD_METERS) {
        await this.remove(marker.id);
      }
    }
  }

  private async show(marker: Marker): Promise<void> {
    if (NotificationManager.activeNotifications.has(marker.id)) {
      return;
    }

    try {
      const notificationId =
        await Notifications.scheduleNotificationAsync({
          content: {
          title: "Вы рядом с меткой!",
          body: `Вы находитесь рядом с точкой «${marker.title}».`,
          data: { markerId: marker.id },
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
          },
          trigger: null,
        });

      NotificationManager.activeNotifications.set(marker.id, {
        markerId: marker.id,
        notificationId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("Не удалось показать уведомление:", error);
    }
  }

  private async remove(markerId: number): Promise<void> {
    const active = NotificationManager.activeNotifications.get(markerId);

    if (!active) return;

    try {
      await Notifications.dismissNotificationAsync(
        active.notificationId
      );

      NotificationManager.activeNotifications.delete(markerId);
    } catch (error) {
      console.warn(
        "Не удалось скрыть уведомление:",
        error
      );
    }
  }

  async restorePresented(): Promise<void> {
    try {
      const presented =
        await Notifications.getPresentedNotificationsAsync();

      for (const notification of presented) {
        const markerId = notification.request.content.data?.markerId;

        if (
          typeof markerId === "number" &&
          !NotificationManager.activeNotifications.has(markerId)
        ) {
          NotificationManager.activeNotifications.set(markerId, {
            markerId,
            notificationId: notification.request.identifier,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.warn("Ошибка восстановления уведомлений:", error);
    }
  }
}
