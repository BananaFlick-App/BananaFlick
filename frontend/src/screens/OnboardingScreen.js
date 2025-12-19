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

  useEffect(() => {
    loadGenres();
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userData?.onboarding_completed) {
          navigation.replace('Main');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
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
      
      // Mark onboarding as complete
      // Skip storage upload for now - not critical for onboarding completion
      // await supabase.storage.from('app').upload('onboarding_complete', new Blob(['1']));
      
      navigation.replace('Main');
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
        <Image source={require('../assets/BananaFlick-logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome to BananaFlick</Text>
        <Text style={styles.subtitle}>Discover movies tailored just for you</Text>
        <TouchableOpacity style={styles.button} onPress={() => setStep(1)}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
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
});
