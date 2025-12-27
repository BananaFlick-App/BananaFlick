import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [pool, setPool] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    console.log('--- HOMESCREEN MOUNTED: V1.0.2 - NEW LOGIC ACTIVE ---');
    fetchInitial(true);
  }, []);

  async function fetchInitial(append = false) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, cannot fetch recommendations');
        return;
      }

      console.log('Fetching recommendations for user:', user.id);
      // Use the new extraParams for clean cache-busting
      const data = await apiClient.getMovies(user.id, 'recommend', { v: Date.now() });
      const results = data && data.results ? data.results : [];
      console.log('Fetched movies, count:', results.length);
      if (results.length > 0) {
        console.log('Movie pool preview (shuffled):', results.slice(0, 5).map(m => `${m.title} [${m.id}]`));
      }

      if (append) {
        setPool(prev => {
          // Filter out duplicates if appending
          const existingIds = new Set(prev.map(m => String(m.id)));
          const uniqueNew = results.filter(m => !existingIds.has(String(m.id)));
          return [...prev, ...uniqueNew];
        });
      } else {
        setPool(results);
        setCurrent(0);
      }
    } catch (e) {
      console.error('Error in fetchInitial:', e);
    }
  }

  async function reshuffle() {
    console.log('Reshuffle button pressed, pool size:', pool.length);

    // Mark current pool as seen so they don't reappear immediately
    if (pool.length > 0) {
      try {
        const ids = pool.map(m => m.id);
        await apiClient.markMoviesSeen(ids);
      } catch (e) {
        console.warn('Failed to mark movies as seen:', e);
      }
    }

    // Fetch fresh recommendations instead of just randomizing local pool
    await fetchInitial(false);
  }



  const getPosterUrl = (path) => {
    if (!path) return null;
    // If the path is already a full URL (from XMDB), use it directly
    if (path.startsWith('http')) return path;
    // Otherwise assume it's a TMDB relative path
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  async function checkAndRefetch() {
    if (current >= pool.length - 2) {
      await fetchInitial(true);
    }
  }

  async function like(item) {
    try {
      const meta = {
        title: item.title,
        poster_path: item.poster_path || item.poster,
        overview: item.overview,
        release_date: item.release_date,
        vote_average: item.vote_average ?? item.rating,
        genre_ids: item.genre_ids
      };
      const response = await apiClient.likeMovie(item.id, meta);
      console.log('Liked movie response:', response);

      // Remove from pool and update index
      setPool(prev => prev.filter(m => String(m.id) !== String(item.id)));
      checkAndRefetch();
    } catch (e) {
      console.error('Error liking movie:', e);
      // Remove anyway to keep moving
      setPool(prev => prev.filter(m => String(m.id) !== String(item.id)));
      checkAndRefetch();
    }
  }

  async function dislike(item) {
    try {
      const response = await apiClient.dislikeMovie(item.id);
      console.log('Dislike response:', response);
    } catch (e) {
      console.error('Error disliking movie:', e);
    }
    // Remove from pool and update index
    setPool(prev => prev.filter(m => String(m.id) !== String(item.id)));
    checkAndRefetch();
  }

  const item = pool[current];

  return (
    <View style={styles.container}>
      {item ? (
        <>
          <Image
            source={{ uri: getPosterUrl(item.poster_path || item.poster || item.image) }}
            style={[styles.poster, { backgroundColor: 'red', borderWidth: 2, borderColor: 'white' }]}
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            onLoad={() => console.log('Image loaded for:', item.title)}
          />
          <View style={styles.info}>
            <Text style={styles.rating}>⭐ {item.vote_average ?? item.rating}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text numberOfLines={3} style={styles.desc}>{item.overview ?? item.description}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Build V1.0.2 - Updated: {new Date().toLocaleTimeString()}</Text>
          </View>

          <View style={styles.actions} pointerEvents="box-none">
            <TouchableOpacity style={styles.btn} onPress={() => dislike(item)}><Text style={styles.btnText}>Dislike</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.like]} onPress={() => like(item)}><Text style={styles.btnText}>Like</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => reshuffle()}><Text style={styles.btnText}>Shuffle</Text></TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ color: '#fff' }}>No items</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff', alignItems: 'center', paddingTop: 20 },
  poster: { width: width * 0.9, height: height * 0.6, resizeMode: 'cover', borderRadius: 12 },
  info: { position: 'absolute', bottom: 140, left: 20, width: width * 0.9 - 40, zIndex: 90 },
  rating: { color: '#fff', fontSize: 12, marginBottom: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  desc: { color: '#ddd', fontSize: 14, marginTop: 6 },
  actions: { position: 'absolute', bottom: 40, flexDirection: 'row', width: '100%', justifyContent: 'center', zIndex: 100 },
  btn: { backgroundColor: '#222', padding: 12, borderRadius: 8, marginHorizontal: 8 },
  like: { backgroundColor: '#e50914' },
  btnText: { color: '#fff' }
});
