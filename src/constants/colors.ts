export const colors = {
  // Бренд
  primary: "#2E7D32",      // тёмно-зелёный акцент (Material Green 800)
  primaryDark: "#1B5E20",  // на будущее — pressed/hover состояния
  primaryLight: "#4CAF50", // на будущее — светлые акценты
  white: "#fff",
  black: "#000",

  // Текст (на тёмном фоне — светлый)
  textPrimary: "#F5F5F5",
  textDark: "#E8E8E8",     // было «тёмное», теперь просто чуть темнее основного
  textMedium: "#CCCCCC",
  textLight: "#AAAAAA",
  textSecondary: "#999999",
  textTertiary: "#888888",
  textMuted: "#666666",

  // Границы
  border: "#333333",
  borderLight: "#2A2A2A",

  // Фоны
  background: "#0D0D0D",       // почти чёрный — основной фон
  backgroundAlt: "#141414",    // альтернативный фон (ошибки, оверлеи)
  backgroundLight: "#1A1A1A",  // карточки-пустышки, секции
  backgroundCard: "#141A14",   // карточки с зеленоватым оттенком
  backgroundMuted: "#222222",  // вторичные кнопки, chips
  backgroundMap: "#1A1A1A",    // фон карты (под WebView / react-native-maps)
  markerIconBg: "#1E3A1E",     // фон иконки маркера в списке — тёмно-зелёный

  // Состояния
  danger: "#EF5350",           // светлее, чтобы читалось на тёмном
  dangerBg: "#3A1F1F",         // тёмно-красный фон для кнопки удаления

  // Затемнения / оверлеи
  overlay: "rgba(0,0,0,0.6)",
  overlayStrong: "rgba(0,0,0,0.8)",
  overlayHint: "rgba(0,0,0,0.85)",
  overlayLight: "rgba(20,20,20,0.95)", 

  // Табы
  tabActive: "#4CAF50",        
  tabInactive: "#777777",

  // Тени
  shadow: "#000",
} as const;

export type ColorName = keyof typeof colors;