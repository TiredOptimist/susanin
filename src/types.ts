import type * as Location from "expo-location";

export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  createdAt: string;
}

export interface MarkerImage {
  id: number;
  markerId: number;
  uri: string;
  createdAt: string;
}

export type MarkerRouteParams = { id: string };

export interface LocationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
}

export interface ActiveNotification {
  markerId: number;
  notificationId: string;
  timestamp: number;
}