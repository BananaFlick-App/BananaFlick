import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { apiClient } from '../api/client';

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route }) {
  const { movieId } = route.params || {};
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (movieId) {
      loadMovieDetails();
    }
  }, [movieId]);

  const loadMovieDetails = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getMovieDetails(movieId);
      console.log('Got movie details:', data);
      setMovie(data);
    } catch (error) {
      console.error('Error loading movie details:', error);
      if (error.response) {
        console.error('Error info:', error.response.data);
        console.error('Status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const getBackdropUrl = (backdropPath) => {
    if (!backdropPath) return null;
    if (backdropPath.startsWith('http')) return backdropPath;
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {getBackdropUrl(movie.backdrop_path) && (
        <Image
          source={{ uri: getBackdropUrl(movie.backdrop_path) }}
          style={styles.backdrop}
        />
      )}
      <View style={styles.content}>
        {getPosterUrl(movie.poster_path) && (
          <Image
            source={{ uri: getPosterUrl(movie.poster_path) }}
            style={styles.poster}
          />
        )}
        <Text style={styles.title}>{movie.title}</Text>
        {movie.vote_average && (
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)} / 10</Text>
          </View>
        )}
        {movie.release_date && (
          <Text style={styles.releaseDate}>
            Release Date: {new Date(movie.release_date).toLocaleDateString()}
          </Text>
        )}
        {movie.overview && (
          <View style={styles.overviewSection}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <Text style={styles.overview}>{movie.overview}</Text>
          </View>
        )}
        {movie.runtime && (
          <Text style={styles.runtime}>Runtime: {movie.runtime} minutes</Text>
        )}
      </View>
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
  backdrop: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  poster: {
    width: width * 0.4,
    height: width * 0.6,
    resizeMode: 'cover',
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  ratingContainer: {
    alignSelf: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  rating: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  releaseDate: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  overviewSection: {
    marginTop: 20,
  },
  overviewTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  overview: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
  },
  runtime: {
    color: '#999',
    fontSize: 14,
    marginTop: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
