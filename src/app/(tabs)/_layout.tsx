import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "../../constants/colors";
import { config, fontWeight } from "../../constants/config";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: config.tabs.height,
          paddingTop: config.tabs.paddingTop,
          paddingBottom: config.tabs.paddingBottom,
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
        },
        tabBarLabelStyle: {
          fontSize: config.tabs.labelFontSize,
          fontWeight: fontWeight.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Карта",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="markers"
        options={{
          title: "Все метки",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}