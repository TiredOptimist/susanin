import { Stack } from "expo-router";
import { DatabaseProvider } from "../contexts/DatabaseContext";

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="marker/[id]" />
      </Stack>
    </DatabaseProvider>
  );
}