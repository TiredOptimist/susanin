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

export type MarkerRouteParams = {
  id: string;
};