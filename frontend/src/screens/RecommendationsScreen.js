import React, { useState, useEffect, useRef } from 'react';
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
  const [userProfile, setUserProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const swiperRef = useRef(null);

  useEffect(() => {
    loadUserAndMovies();

    // Refresh when screen comes into focus to reflect any settings changes
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Discover screen focused, refreshing recommendations');
      loadUserAndMovies();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserAndMovies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);

      // Fetch user profile for personalization
      const profile = await apiClient.getUser();
      setUserProfile(profile);

      await loadMovies(user?.id, profile);
    } catch (error) {
      console.error('Error loading user:', error);
      await loadMovies();
    }
  };

  const loadMovies = async (uid = null, profile = null) => {
    setLoading(true);
    try {
      const targetUid = uid || userId;
      const activeProfile = profile || userProfile;
      console.log('Fetching movies for UID:', targetUid);

      // Try to get recommendations
      let data = await apiClient.getMovies(targetUid, 'recommend');
      let results = data.results || [];

      // If less than 5 movies, fallback to discover to ensure we have a full deck
      if (results.length < 5) {
        console.log('Too few recommendations, fetching discovery movies as fallback');
        const region = activeProfile?.location || 'US';
        const genres = activeProfile?.favorite_genres || [];
        const randomGenre = genres.length > 0 ? genres[Math.floor(Math.random() * genres.length)] : undefined;

        const discoveryData = await apiClient.discoverMovies(randomGenre, region, Math.floor(Math.random() * 10) + 1);
        const discoveryResults = discoveryData?.results || [];
        results = [...results, ...discoveryResults];
      }

      // Filter out any duplicates just in case
      let combined = Array.from(new Map(results.map(m => [m.id, m])).values());

      // Take top 5 personalized candidates
      const fiveMovies = combined.slice(0, 5);

      console.log('Fetched', fiveMovies.length, 'movies for the deck');

      // Persist seen status for 24h in the database
      try {
        await apiClient.markMoviesSeen(fiveMovies.map(m => m.id));
      } catch (seenError) {
        console.warn('Failed to persist seen status:', seenError);
      }

      setMovies(fiveMovies);
      setCurrentIndex(0);
      setRefreshKey(prev => prev + 1); // Force Swiper re-render

      if (swiperRef.current) {
        swiperRef.current.scrollTo(0, false);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load recommendations';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reshuffle = async () => {
    console.log('Reshuffle triggered');
    setMovies([]); // Show loading state
    await loadMovies(userId, userProfile);
  };

  const handleLike = async (movie) => {
    if (movie.isShuffleCard) {
      reshuffle();
      return;
    }
    try {
      const meta = {
        title: movie.title,
        poster_path: movie.poster_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids
      };
      await apiClient.likeMovie(movie.id, meta);

      // Move to next slide
      if (currentIndex < movies.length) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (swiperRef.current) {
          swiperRef.current.scrollTo(nextIndex, true);
        }
      }
    } catch (error) {
      console.error('Error liking movie:', error);
      Alert.alert('Error', 'Failed to save like.');
    }
  };

  const handleDislike = async (movie) => {
    if (movie.isShuffleCard) return;
    try {
      await apiClient.dislikeMovie(movie.id);

      // Move to next slide
      if (currentIndex < movies.length) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (swiperRef.current) {
          swiperRef.current.scrollTo(nextIndex, true);
        }
      }
    } catch (error) {
      console.error('Error disliking movie:', error);
      Alert.alert('Error', 'Failed to save dislike.');
    }
  };

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null;
    if (posterPath.startsWith('http')) return posterPath;
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  if (loading && movies.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Curating your recommendations...</Text>
      </View>
    );
  }

  // Create the swipe items: 5 movies + 1 Shuffle card
  const swipeItems = [
    ...movies,
    { id: 'shuffle-card', isShuffleCard: true, title: 'End of current deck' }
  ];

  return (
    <View style={styles.container}>
      <Swiper
        key={refreshKey}
        ref={swiperRef}
        loop={false}
        showsPagination={true}
        index={currentIndex}
        onIndexChanged={setCurrentIndex}
        containerStyle={styles.swiperContainer}
        dot={<View style={styles.dot} />}
        activeDot={<View style={styles.activeDot} />}
        paginationStyle={styles.pagination}
      >
        {swipeItems.map((movie, index) => {
          if (movie.isShuffleCard) {
            return (
              <View key="shuffle" style={styles.slide}>
                <View style={styles.shuffleCard}>
                  <Text style={styles.shuffleCardEmoji}>🔄</Text>
                  <Text style={styles.shuffleCardTitle}>Ready for more?</Text>
                  <Text style={styles.shuffleCardSub}>You've seen all 5 movies in this deck.</Text>
                  <TouchableOpacity style={styles.button} onPress={reshuffle}>
                    <Text style={styles.buttonText}>Fetch New Movies</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return (
            <View key={movie.id || index} style={styles.slide}>
              <Image
                source={{ uri: getPosterUrl(movie.poster_path) }}
                style={styles.poster}
                defaultSource={require('../assets/BananaFlick-logo.png')}
              />
              <View style={styles.overlay} />


              <View style={styles.info} pointerEvents="box-none">
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
              </View>

              <View style={styles.actions} pointerEvents="box-none">
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
          );
        })}
      </Swiper>
      <TouchableOpacity style={styles.reshuffleButton} onPress={reshuffle}>
        <Text style={styles.reshuffleText}>🔄 Refresh</Text>
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
    height: height * 0.65,
    resizeMode: 'cover',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  info: {
    position: 'absolute',
    bottom: 125,
    left: 25,
    right: 25,
  },
  ratingContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  rating: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  overview: {
    color: '#eee',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  releaseDate: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
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
  swiperContainer: {
    flex: 1,
  },
  shuffleCard: {
    width: width * 0.9,
    height: height * 0.65,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  shuffleCardEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  shuffleCardTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  shuffleCardSub: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginLeft: 3,
    marginRight: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginLeft: 3,
    marginRight: 3,
  },
  pagination: {
    bottom: 120,
  },
});
