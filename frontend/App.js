import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/supabaseClient';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import { Text, View, ActivityIndicator } from 'react-native';
import { enableScreens } from 'react-native-screens';
enableScreens();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#e50914',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Recommendations"
        component={RecommendationsScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎬</Text>,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>❤️</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Try to initialize and check onboarding status
    try {
      checkOnboardingStatus();
      
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          setShowOnboarding(true);
        }
      });

      return () => subscription?.unsubscribe();
    } catch (error) {
      console.error('Error initializing app:', error);
      setInitializing(false);
      setShowOnboarding(true);
    }
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Create anonymous session for new users
        console.log('Signing in anonymously...');
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        console.log('Anonymous sign in result:', authData, authError);
        if (authData.user) {
          // Check if onboarding is completed
          const { data: userData } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('auth_user_id', authData.user.id)
            .single();
          
          setShowOnboarding(!userData?.onboarding_completed);
        } else {
          setShowOnboarding(true);
        }
      } else {
        // Check if onboarding is completed
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('auth_user_id', user.id)
          .single();
        
        setShowOnboarding(!userData?.onboarding_completed);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      // Default to showing onboarding if there's an error
      setShowOnboarding(true);
    } finally {
      setInitializing(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e50914" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="Details" 
            component={DetailsScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
console.log('EXPO ENV URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log(
  'EXPO ENV KEY:',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10)
);
