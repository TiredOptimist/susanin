import { colors } from "../constants/colors";
import {
    config,
    fontSize,
    MAPLIBRE_CSS_URL,
    MAPLIBRE_JS_URL,
} from "../constants/config";

export function buildMapHtml(): string {
  const {
    initialCenter,
    zoom,
    styleUrl,
    longPressDurationMs,
    moveTolerancePx,
  } = config.map;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />
  <link href="${MAPLIBRE_CSS_URL}" rel="stylesheet" />
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
      border: 3px solid ${colors.white};
      border-radius: 50% 50% 50% 0;
      background: ${colors.primaryLight};
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px ${colors.overlay};
      cursor: pointer;
    }
    .custom-marker-inner {
      width: 8px;
      height: 8px;
      margin: 6px;
      background: ${colors.white};
      border-radius: 50%;
    }
    .maplibregl-ctrl-group {
      background: #1A1A1A !important;
      border: 1px solid #333 !important;
    }
    .maplibregl-ctrl-group button {
      background: transparent !important;
    }
    .maplibregl-ctrl-group button + button {
      border-top: 1px solid #333 !important;
    }
    .maplibregl-ctrl-icon {
      filter: invert(1);
    }
    .maplibregl-ctrl-attrib {
      background: rgba(20,20,20,0.7) !important;
      color: #aaa !important;
    }
    .maplibregl-ctrl-attrib a {
      color: #ccc !important;
    }
    .maplibregl-popup-content {
      font-size: ${fontSize.md}px;
      overflow-wrap: anywhere;
      background: #1A1A1A;
      color: ${colors.textPrimary};
    }
    .maplibregl-popup-tip {
      border-top-color: #1A1A1A;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="${MAPLIBRE_JS_URL}"></script>
  <script>
    (function () {
      function send(data) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      }

      try {
        if (!window.maplibregl) {
          send({ type: "error", message: "MapLibre не загрузился" });
          return;
        }

        var map = new maplibregl.Map({
          container: "map",
          style: ${JSON.stringify(styleUrl)},
          center: ${JSON.stringify(initialCenter)},
          zoom: ${zoom}
        });

        map.addControl(
          new maplibregl.NavigationControl(),
          "top-right"
        );

        var markersById = {};

        function createEntry(item) {
          var element = document.createElement("div");
          element.className = "custom-marker";
          element.setAttribute("role", "button");
          element.setAttribute("aria-label", item.title || "Метка");

          var inner = document.createElement("div");
          inner.className = "custom-marker-inner";
          element.appendChild(inner);

          var marker = new maplibregl.Marker({ element: element })
            .setLngLat([item.longitude, item.latitude])
            .addTo(map);

          element.addEventListener("click", function (event) {
            event.stopPropagation();
            send({ type: "markerPress", id: item.id });
          });

          var popupContent = document.createElement("div");
          popupContent.textContent = item.title;

          marker.setPopup(
            new maplibregl.Popup({ offset: 20 }).setDOMContent(popupContent)
          );

          return { marker: marker, element: element, title: item.title };
        }

        window.updateMarkers = function (data) {
          if (!Array.isArray(data)) data = [];

          var incoming = {};

          data.forEach(function (item) {
            incoming[item.id] = true;
            var entry = markersById[item.id];

            if (entry) {
              entry.marker.setLngLat([item.longitude, item.latitude]);

              if (entry.title !== item.title) {
                var popupContent = document.createElement("div");
                popupContent.textContent = item.title;
                entry.marker.setPopup(
                  new maplibregl.Popup({ offset: 20 })
                    .setDOMContent(popupContent)
                );
                entry.element.setAttribute(
                  "aria-label",
                  item.title || "Метка"
                );
                entry.title = item.title;
              }
            } else {
              markersById[item.id] = createEntry(item);
            }
          });

          Object.keys(markersById).forEach(function (id) {
            if (!incoming[id]) {
              markersById[id].marker.remove();
              delete markersById[id];
            }
          });
        };

        document.addEventListener("contextmenu", function (event) {
          event.preventDefault();
        });

        var longPressStart = null;

        document.addEventListener("touchstart", function (event) {
          if (event.touches.length !== 1) {
            longPressStart = null;
            return;
          }

          var target = event.target;

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

          if (Math.sqrt(dx * dx + dy * dy) > ${moveTolerancePx}) {
            longPressStart = null;
          }
        }, { passive: true });

        // Сбрасываем состояние при отмене жеста (звонок, системный жест и т.п.)
        document.addEventListener("touchcancel", function () {
          longPressStart = null;
        }, { passive: true });

        document.addEventListener("touchend", function () {
          if (!longPressStart) return;

          var start = longPressStart;
          longPressStart = null;

          if (Date.now() - start.time < ${longPressDurationMs}) return;

          var rect = map.getContainer().getBoundingClientRect();
          var point = [start.x - rect.left, start.y - rect.top];
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
        send({
          type: "error",
          message: error && error.message ? error.message : "Unknown error"
        });
      }
    })();
  </script>
</body>
</html>`;
}