export const colors = {
  // Бренд
  primary: "#2E7D32",      
  primaryDark: "#1B5E20",  
  primaryLight: "#4CAF50", 
  white: "#fff",
  black: "#000",

  textPrimary: "#F5F5F5",
  textDark: "#E8E8E8",     
  textMedium: "#CCCCCC",
  textLight: "#AAAAAA",
  textSecondary: "#999999",
  textTertiary: "#888888",
  textMuted: "#666666",

  // Границы
  border: "#333333",
  borderLight: "#2A2A2A",

  // Фоны
  background: "#0D0D0D",       
  backgroundAlt: "#141414",    
  backgroundLight: "#1A1A1A",  
  backgroundCard: "#141A14",   
  backgroundMuted: "#222222",  
  backgroundMap: "#1A1A1A",    
  markerIconBg: "#1E3A1E",    

  // Состояния
  danger: "#EF5350",           
  dangerBg: "#3A1F1F",        

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