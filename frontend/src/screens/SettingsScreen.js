import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('US');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, genresData] = await Promise.all([
        apiClient.getUser(),
        apiClient.getGenres(),
      ]);

      setUser(userData);
      if (userData) {
        setName(userData.name || '');
        setLocation(userData.location || 'US');
        setSelectedGenres(userData.favorite_genres || []);
      }
      setGenres(genresData.genres || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Log more details if available
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Please select at least one favorite genre');
      return;
    }

    setSaving(true);
    try {
      await apiClient.updateSettings({
        name: name.trim(),
        favorite_genres: selectedGenres,
        location: location.toUpperCase(),
      });
      Alert.alert('Success', 'Settings saved successfully!');
      await loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            // Navigation will be handled by auth state change
          },
        },
      ]
    );
  };

  const commonLocations = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP', 'KR', 'IN', 'BR', 'MX'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.label}>Country Code</Text>
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
                location.toUpperCase() === loc && styles.locationChipSelected
              ]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[
                styles.locationText,
                location.toUpperCase() === loc && styles.locationTextSelected
              ]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Genres</Text>
        <Text style={styles.label}>Select your favorite genres</Text>
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
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Settings</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickSelect: {
    color: '#999',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
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
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
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
  saveButton: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

