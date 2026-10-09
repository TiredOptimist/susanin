import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Marker, MarkerImage } from "../../types";

interface MarkerContextValue {
  markers: Marker[];
  images: MarkerImage[];

  addMarker: (latitude: number, longitude: number, title: string) => Marker;

  removeMarker: (markerId: number) => void;

  addImage: (markerId: number, uri: string) => MarkerImage;

  removeImage: (imageId: number) => void;

  getMarker: (markerId: number) => Marker | undefined;

  getMarkerImages: (markerId: number) => MarkerImage[];
}

const MarkerContext = createContext<MarkerContextValue | undefined>(
  undefined
);

export function MarkerProvider({ children }: PropsWithChildren) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [images, setImages] = useState<MarkerImage[]>([]);

  const addMarker = (latitude: number, longitude: number, title: string): Marker => {
    const newMarker: Marker = {
      id: Date.now(),
      latitude,
      longitude,
      title,
      createdAt: new Date().toISOString(),
    };

    setMarkers((currentMarkers) => [
      ...currentMarkers,
      newMarker,
    ]);

    return newMarker;
  };

  const removeMarker = (markerId: number) => { 
    setMarkers((prev) => 
      prev.filter( (marker) => 
        marker.id !== markerId 
      ) 
    ); 
    setImages((prev) => 
      prev.filter( (image) => 
        image.markerId !== markerId 
      ) 
    ); 
  };

  const addImage = (
    markerId: number,
    uri: string
  ): MarkerImage => {
    const newImage: MarkerImage = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      markerId,
      uri,
      createdAt: new Date().toISOString(),
    };

    setImages((currentImages) => [
      ...currentImages,
      newImage,
    ]);

    return newImage;
  };

  const removeImage = (imageId: number) => {
    setImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId)
    );
  };

  const getMarker = (markerId: number) => {
    return markers.find((marker) => marker.id === markerId);
  };

  const getMarkerImages = (markerId: number) => {
    return images.filter((image) => image.markerId === markerId);
  };

  const value = useMemo<MarkerContextValue>(
    () => ({
      markers,
      images,
      addMarker,
      removeMarker,
      addImage,
      removeImage,
      getMarker,
      getMarkerImages,
    }),
    [markers, images]
  );

  return (
    <MarkerContext.Provider value={value}>
      {children}
    </MarkerContext.Provider>
  );
}

export function useMarkers() {
  const context = useContext(MarkerContext);

  if (!context) {
    throw new Error(
      "useMarkers должен использоваться внутри MarkerProvider"
    );
  }

  return context;
}