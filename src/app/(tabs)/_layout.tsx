import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#208AEF",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          height: 65,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#fff",
          borderTopColor: "#E5E7EB",
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Карта",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>
              📍
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="markers"
        options={{
          title: "Все метки",
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>
              ☰
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}