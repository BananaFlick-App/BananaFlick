import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { apiClient } from '../api/client';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });

    return unsubscribe;
  }, [navigation]);

  const loadFavorites = async () => {
    console.log('Loading favorites...');
    setLoading(true);
    try {
      const data = await apiClient.getFavorites();
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPosterUrl = (meta) => {
    if (meta?.poster_path) {
      // If poster_path is already a full URL (from XMDB), use it directly
      if (meta.poster_path.startsWith('http')) return meta.poster_path;
      // Otherwise assume it's a TMDB relative path
      return `https://image.tmdb.org/t/p/w500${meta.poster_path}`;
    }
    return null;
  };

  const handleRemove = async (movieId) => {
    try {
      await apiClient.unlikeMovie(movieId);
      setFavorites(prev => prev.filter(item => item.item_id !== String(movieId)));
    } catch (error) {
      console.error('Error removing favorite:', error);
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to remove from favorites';
      Alert.alert('Error', message);
    }
  };

  const renderFavorite = ({ item }) => {
    const posterUrl = getPosterUrl(item.meta);
    const title = item.meta?.title || item.item_id;

    return (
      <View style={styles.movieCard}>
        <TouchableOpacity
          onPress={() => {
            if (item.item_id) {
              navigation.navigate('Details', { movieId: item.item_id });
            }
          }}
        >
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.placeholder]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item.item_id)}
          >
            <Text style={styles.removeButtonText}>Remove ❤️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No favorites yet</Text>
        <Text style={styles.emptySubtext}>Start liking movies to see them here!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Favorites</Text>
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={(item) => item.id?.toString() || item.item_id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  movieCard: {
    width: (width - 40) / 2,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: '#e50914',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: '700',
  },
});

