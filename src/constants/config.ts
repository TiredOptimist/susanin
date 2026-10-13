// Отступы (padding / margin / gap)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
  huge: 18,
  giant: 20,
  massive: 24,
  colossal: 28,
  mega: 30,
  ultra: 40,
} as const;

// Радиусы скругления
export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 18,
  round: 22,
  pill: 999,
} as const;

// Размеры шрифта
export const fontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 17,
  title: 19,
  h2: 22,
  h1: 24,
  display: 28,
} as const;

// Насыщенность шрифта
export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// Общий конфиг приложения
export const config = {
  database: {
    name: "markers.db",
    version: 1,
  },

  map: {
    initialCenter: [37.618423, 55.751244] as [number, number],
    initialRegion: {
      latitude: 55.751244,
      longitude: 37.618423,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    },
    zoom: 10,
    longPressDurationMs: 400,
    moveTolerancePx: 12,
    styleUrl: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    maplibreVersion: "5.6.2",
    readyTimeoutMs: 10000,
  },

  tabs: {
    height: 65,
    paddingTop: 8,
    paddingBottom: 8,
    labelFontSize: 13,
  },

  imagePicker: {
    quality: 0.8,
    selectionLimit: 10,
  },
} as const;

export const MAPLIBRE_CSS_URL = `https://unpkg.com/maplibre-gl@${config.map.maplibreVersion}/dist/maplibre-gl.css`;
export const MAPLIBRE_JS_URL = `https://unpkg.com/maplibre-gl@${config.map.maplibreVersion}/dist/maplibre-gl.js`;