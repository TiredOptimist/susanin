import * as Location from "expo-location";

export interface LocationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
}

export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000, // не чаще раза в 5 секунд
  distanceInterval: 5, // и при смещении минимум на 5 метров
};

export class LocationError extends Error {
  constructor(
    public kind:
      | "services-disabled"
      | "permission-denied"
      | "permission-blocked"
      | "unavailable",
    message: string
  ) {
    super(message);
    this.name = "LocationError";
  }
}

export async function getInitialLocation(): Promise<Location.LocationObject | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return location;
  } catch (e) {
    console.warn("Не удалось получить начальную геопозицию", e);
    return null;
  }
}

export async function ensureLocationServicesEnabled(): Promise<void> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new LocationError(
      "services-disabled",
      "Службы геолокации отключены. Включите GPS в настройках устройства."
    );
  }
}

export async function requestLocationPermissions(): Promise<void> {
  const { status, canAskAgain } =
    await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    if (canAskAgain) {
      throw new LocationError(
        "permission-denied",
        "Доступ к местоположению не разрешён."
      );
    } else {
      throw new LocationError(
        "permission-blocked",
        "Доступ к местоположению заблокирован. Разрешите его в настройках приложения."
      );
    }
  }
}

export async function startLocationUpdates(
  onLocation: (location: Location.LocationObject) => void,
  config: LocationConfig = DEFAULT_LOCATION_CONFIG
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(config, onLocation);
}