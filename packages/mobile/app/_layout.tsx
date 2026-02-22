import "../src/i18n";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0e1a" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="token-detail" />
      </Stack>
    </QueryClientProvider>
  );
}
