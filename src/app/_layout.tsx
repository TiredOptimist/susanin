import { Stack } from "expo-router";
import { MarkerProvider } from "../context/MarkerContext";

export default function RootLayout() {
  return (
    <MarkerProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="marker/[id]" />
      </Stack>
    </MarkerProvider>
  );
}