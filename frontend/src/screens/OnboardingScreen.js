import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [location, setLocation] = useState('US');
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'

  useEffect(() => {
    loadGenres();
  }, []);

  const handleAuth = async () => {
    if (!email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          if (data.session) {
            alert('Account created! Please enter your name.');
            setStep(1);
          } else {
            alert('Account created! Please check your email for a verification link before logging in.');
            setStep(0);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            alert('Please check your email and confirm your account before logging in.');
            return;
          }
          throw error;
        }
        if (data.user) {
          // Check if user already has a profile
          const { data: profile } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('auth_user_id', data.user.id)
            .single();

          if (profile?.onboarding_completed) {
            // App.js listener will handle navigation to Main
          } else {
            setStep(1);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const data = await apiClient.getGenres();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (selectedGenres.length === 0) {
      alert('Please select at least one favorite genre');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Create anonymous user if not logged in
        const { data: authData } = await supabase.auth.signInAnonymously();
        if (authData.user) {
          await apiClient.completeOnboarding(name, selectedGenres, location);
        }
      } else {
        await apiClient.completeOnboarding(name, selectedGenres, location);
      }

      // Update local user metadata to trigger the auth listener in App.js
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });

      // navigation.replace('Main') is intentionally removed as the App state change 
      // will handle switching navigators automatically.
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Image source={require('../assets/BananaFlick-logo.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome to BananaFlick</Text>
          <Text style={styles.subtitle}>Discover movies tailored just for you</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setAuthMode('signup');
              setStep(4);
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign Up with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              setAuthMode('login');
              setStep(4);
            }}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Login with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestLink}
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={styles.guestLinkText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What's your name?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={() => setStep(2)}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 2) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Select your favorite genres</Text>
        <Text style={styles.subtitle}>Choose at least one (you can select multiple)</Text>
        <View style={styles.genreGrid}>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreChip,
                selectedGenres.includes(String(genre.id)) && styles.genreChipSelected
              ]}
              onPress={() => toggleGenre(String(genre.id))}
            >
              <Text style={[
                styles.genreText,
                selectedGenres.includes(String(genre.id)) && styles.genreTextSelected
              ]}>
                {genre.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.button, selectedGenres.length === 0 && styles.buttonDisabled]}
          onPress={() => setStep(3)}
          disabled={selectedGenres.length === 0}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 3) {
    const commonLocations = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP', 'KR', 'IN', 'BR', 'MX'];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Where are you located?</Text>
        <Text style={styles.subtitle}>This helps us show you relevant movies</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter country code (e.g., US, GB, CA)"
          placeholderTextColor="#666"
          value={location}
          onChangeText={setLocation}
          maxLength={2}
          autoCapitalize="characters"
        />
        <Text style={styles.quickSelect}>Quick select:</Text>
        <View style={styles.locationGrid}>
          {commonLocations.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[
                styles.locationChip,
                location === loc && styles.locationChipSelected
              ]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[
                styles.locationText,
                location === loc && styles.locationTextSelected
              ]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 4) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(0)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {authMode === 'signup'
            ? 'Sign up to save your favorites across devices'
            : 'Login to access your personalized movies'}
        </Text>

        <View style={styles.authForm}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {authMode === 'signup' ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
          >
            <Text style={styles.switchAuthText}>
              {authMode === 'signup'
                ? 'Already have an account? Login'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 20,
  },
  genreChip: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreChipSelected: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
  },
  genreTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  quickSelect: {
    color: '#999',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  locationChip: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    margin: 6,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  locationChipSelected: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationTextSelected: {
    color: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    flexGrow: 1,
    paddingBottom: 40,
  },
  secondaryButton: {
    backgroundColor: '#333',
    marginTop: 15,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  guestLink: {
    marginTop: 25,
    padding: 10,
    alignSelf: 'center',
  },
  guestLinkText: {
    color: '#999',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    padding: 10,
    zIndex: 10,
  },
  backButtonText: {
    color: '#e50914',
    fontSize: 16,
    fontWeight: '600',
  },
  authForm: {
    marginTop: 20,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  switchAuth: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  switchAuthText: {
    color: '#999',
    fontSize: 14,
  },
});
