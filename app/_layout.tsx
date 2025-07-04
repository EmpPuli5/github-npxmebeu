import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppProvider } from '@/contexts/AppContext';

// Keep the splash screen visible until we're done loading fonts
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useFrameworkReady();

  // Load our custom fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Hide the splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
        <Stack.Screen 
          name="modals/add-task" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add New Task',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/edit-goal" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Edit Task',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/set-timer" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Set Timer',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/add-habit" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add New Habit',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/add-long-term-goal" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add Long-term Goal',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/add-workout" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add Workout',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/add-productive-activity" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Add Productive Activity',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/journal-entry" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            title: 'Journal Entry',
            headerTitleStyle: {
              fontFamily: 'Inter-SemiBold',
            },
          }} 
        />
        <Stack.Screen 
          name="modals/morning-quiz" 
          options={{ 
            presentation: 'fullScreenModal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="modals/evening-quiz" 
          options={{ 
            presentation: 'fullScreenModal',
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </AppProvider>
  );
}