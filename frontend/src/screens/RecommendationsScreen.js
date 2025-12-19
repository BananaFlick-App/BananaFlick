import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import Swiper from 'react-native-swiper';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function RecommendationsScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndMovies();
  }, []);

  const loadUserAndMovies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
      await loadMovies(user?.id);
    } catch (error) {
      console.error('Error loading user:', error);
      await loadMovies();
    }
  };

  const loadMovies = async (uid = null) => {
    setLoading(true);
    try {
      const data = await apiClient.getMovies('recommend');
      const results = data.results || [];
      // Show first 5 movies
      setMovies(results.slice(0, 5));
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading movies:', error);
      // Log more details if available
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load recommendations';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reshuffle = async () => {
    await loadMovies(userId);
  };

  const handleLike = async (movie) => {
    try {
      await apiClient.likeMovie(movie);
      
      // Move to next movie
      if (currentIndex < movies.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Load more movies if at the end
        await loadMovies(userId);
      }
    } catch (error) {
      console.error('Error liking movie:', error);
      Alert.alert('Error', 'Failed to save like. Please try again.');
    }
  };

  const handleDislike = async (movie) => {
    try {
      await apiClient.dislikeMovie(movie);
      
      // Move to next movie
      if (currentIndex < movies.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Load more movies if at the end
        await loadMovies(userId);
      }
    } catch (error) {
      console.error('Error disliking movie:', error);
      Alert.alert('Error', 'Failed to save dislike. Please try again.');
    }
  };

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  if (loading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No recommendations available</Text>
        <TouchableOpacity style={styles.button} onPress={reshuffle}>
          <Text style={styles.buttonText}>Reshuffle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        loop={false}
        showsPagination={false}
        index={currentIndex}
        onIndexChanged={setCurrentIndex}
        style={styles.swiper}
      >
        {movies.map((movie, index) => (
          <View key={movie.id || index} style={styles.slide}>
            <Image
              source={{ uri: getPosterUrl(movie.poster_path) }}
              style={styles.poster}
              defaultSource={require('../assets/BananaFlick-logo.png')}
            />
            <View style={styles.overlay} />
            <View style={styles.info}>
              {movie.vote_average && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.title}>{movie.title}</Text>
              {movie.overview && (
                <Text numberOfLines={3} style={styles.overview}>
                  {movie.overview}
                </Text>
              )}
              {movie.release_date && (
                <Text style={styles.releaseDate}>{new Date(movie.release_date).getFullYear()}</Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.dislikeButton]}
                onPress={() => handleDislike(movie)}
              >
                <Text style={styles.actionButtonText}>👎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={() => handleLike(movie)}
              >
                <Text style={styles.actionButtonText}>👍</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Swiper>
      <TouchableOpacity style={styles.reshuffleButton} onPress={reshuffle}>
        <Text style={styles.reshuffleText}>🔄 Reshuffle</Text>
      </TouchableOpacity>
    </View>
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
  swiper: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    width: width * 0.9,
    height: height * 0.7,
    resizeMode: 'cover',
    borderRadius: 20,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  info: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  ratingContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 9, 20, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  rating: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  overview: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  releaseDate: {
    color: '#999',
    fontSize: 12,
  },
  actions: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dislikeButton: {
    backgroundColor: '#333',
  },
  likeButton: {
    backgroundColor: '#e50914',
  },
  actionButtonText: {
    fontSize: 32,
  },
  reshuffleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  reshuffleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
    minWidth: 150,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
