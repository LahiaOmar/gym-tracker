import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { ActiveSessionProvider } from '@/contexts/ActiveSessionContext';
import { StorageProvider } from '@/contexts/StorageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StorageProvider>
          <ActiveSessionProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: BrandColors.navy },
                headerTintColor: BrandColors.white,
                headerTitleStyle: { fontWeight: '600' },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="select-category" options={{ headerShown: false }} />
              <Stack.Screen name="session-summary" options={{ title: 'Workout Summary' }} />
              <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ActiveSessionProvider>
        </StorageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
