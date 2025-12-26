import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [pool, setPool] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchInitial(true);
  }, []);

  async function fetchInitial(append = false) {
    try {
      // Use random page or iterate? For now random to ensure variety
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const data = await apiClient.discoverMovies(undefined, 'US', randomPage);
      const results = data && data.results ? data.results : [];
      console.log('Fetched movies, count:', results.length);

      if (append) {
        setPool(prev => [...prev, ...results]);
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
    if (pool.length < 5) {
      console.log('Pool low, fetching more movies');
      await fetchInitial(true);
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setCurrent(0);
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
      setCurrent(i => i + 1);
      checkAndRefetch();
    } catch (e) {
      console.error('Error liking movie:', e);
      setCurrent(i => i + 1);
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
    setCurrent(i => i + 1);
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
