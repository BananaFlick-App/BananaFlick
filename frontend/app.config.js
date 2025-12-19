export default {
  expo: {
    name: 'BananaFlick',
    slug: 'bananaflick',
    scheme: 'bananaflick',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/BananaFlick-logo.png',
    userInterfaceStyle: 'automatic',
    splash: {
      backgroundColor: '#000000',
    },
    android: {
      package: 'com.bananaflick.app',
    },
    extra: {
      supabaseUrl: 'https://kxpcwleogbutevqujqoz.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cGN3bGVvZ2J1dGV2cXVqcW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE2ODksImV4cCI6MjA4MTMwNzY4OX0.YaiJ119ZSEwAd5dc9mGvw9Rx06zN7kCDjd3Jz1RjkG4',
    },
  },
};
