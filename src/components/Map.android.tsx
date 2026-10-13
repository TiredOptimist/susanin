
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import type { Marker } from "../types";

interface MapComponentProps {
  markers: Marker[];
  onAddMarker: (
    latitude: number,
    longitude: number
  ) => void;
  onMarkerPress: (marker: Marker) => void;
}

const INITIAL_CENTER: [number, number] = [
  37.618423,
  55.751244,
];

export default function MapComponent({
  markers,
  onAddMarker,
  onMarkerPress,
}: MapComponentProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const html = useMemo(() => {
    const markerData = JSON.stringify(
      markers.map((marker) => ({
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
        title: marker.title,
      }))
    ).replace(/</g, "\\u003c");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
  <link
    href="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css"
    rel="stylesheet"
  />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: sans-serif;
    }
    .custom-marker {
      width: 26px;
      height: 26px;
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      background: #208AEF;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px #0005;
    }
    .custom-marker-inner {
      width: 8px;
      height: 8px;
      margin: 6px;
      background: white;
      border-radius: 50%;
    }
    .maplibregl-popup-content {
      font-size: 14px;
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js"></script>
  <script>
    (function () {
      function send(data) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify(data)
          );
        }
      }

      try {
        if (!window.maplibregl) {
          send({ type: "error" });
          return;
        }

        var markers = ${markerData};

        var map = new maplibregl.Map({
          container: "map",
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: ${JSON.stringify(INITIAL_CENTER)},
          zoom: 10
        });

        map.addControl(
          new maplibregl.NavigationControl(),
          "top-right"
        );

        markers.forEach(function (item) {
          var element = document.createElement("div");
          element.className = "custom-marker";

          var inner = document.createElement("div");
          inner.className = "custom-marker-inner";
          element.appendChild(inner);

          var marker = new maplibregl.Marker({
            element: element
          })
            .setLngLat([item.longitude, item.latitude])
            .addTo(map);

          element.addEventListener("click", function (event) {
            event.stopPropagation();
            send({
              type: "markerPress",
              id: item.id
            });
          });

          var popupContent = document.createElement("div");
          popupContent.textContent = item.title;

          marker.setPopup(
            new maplibregl.Popup({ offset: 20 })
              .setDOMContent(popupContent)
          );
        });

        
        // Блокируем системное контекстное меню WebView.
        document.addEventListener("contextmenu", function (event) {
          event.preventDefault();
        });

        // Обрабатываем долгое нажатие самостоятельно.
        var longPressStart = null;

        document.addEventListener("touchstart", function (event) {
          if (event.touches.length !== 1) {
            longPressStart = null;
            return;
          }

          var target = event.target;

          // Не добавляем метки при нажатии на существующие
          // метки, кнопки управления и всплывающие окна.
          if (
            target.closest &&
            target.closest(
              ".maplibregl-marker, .maplibregl-control-container, .maplibregl-popup"
            )
          ) {
            longPressStart = null;
            return;
          }

          var touch = event.touches[0];

          longPressStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          };
        }, { passive: true });

        document.addEventListener("touchmove", function (event) {
          if (!longPressStart || !event.touches.length) return;

          var touch = event.touches[0];
          var dx = touch.clientX - longPressStart.x;
          var dy = touch.clientY - longPressStart.y;

          // Если пользователь перемещает карту, отменяем
          // создание метки.
          if (Math.sqrt(dx * dx + dy * dy) > 12) {
            longPressStart = null;
          }
        }, { passive: true });

        document.addEventListener("touchend", function () {
          if (!longPressStart) return;

          var start = longPressStart;
          longPressStart = null;

          // Требуем удерживать палец не менее 650 мс.
          if (Date.now() - start.time < 650) return;

          var rect = map.getContainer().getBoundingClientRect();

          var point = [
            start.x - rect.left,
            start.y - rect.top
          ];

          var coordinates = map.unproject(point);

          send({
            type: "addMarker",
            latitude: coordinates.lat,
            longitude: coordinates.lng
          });
        }, { passive: true });

        map.once("load", function () {
          send({ type: "ready" });
        });
      } catch (error) {
        send({ type: "error" });
      }
    })();
  </script>
</body>
</html>`;
  }, [markers]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "ready") {
        setIsMapReady(true);
        setMapError(false);
      }

      if (message.type === "error") {
        setMapError(true);
      }

      if (message.type === "addMarker") {
        const latitude = Number(message.latitude);
        const longitude = Number(message.longitude);

        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        ) {
          onAddMarker(latitude, longitude);
        }
      }

      if (message.type === "markerPress") {
        const marker = markers.find(
          (item) => item.id === Number(message.id)
        );

        if (marker) {
          onMarkerPress(marker);
        }
      }
    } catch (error) {
      console.warn("Ошибка сообщения карты:", error);
    }
  };

  if (mapError) {
    return (
      <View style={styles.message}>
        <Text style={styles.errorTitle}>Не удалось загрузить карту</Text>
        <Text style={styles.errorText}>
          Проверь подключение к интернету и попробуй перезапустить экран.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() => setMapError(true)}
      />

      {!isMapReady && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#208AEF" />
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </View>
      )}

      <View pointerEvents="none" style={styles.hint}>
        <Text style={styles.hintText}>
          Нажмите и удерживайте карту, чтобы добавить метку
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: "#e8e8e8",
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#333",
  },
  hint: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    padding: 12,
  },
  hintText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f5f5f5",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
});