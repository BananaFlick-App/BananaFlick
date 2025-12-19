import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { apiClient } from '../api/client';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [pool, setPool] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => { fetchInitial(); }, []);

  async function fetchInitial() {
    try {
      const data = await apiClient.discoverMovies('Action', 'US', 1);
      const results = data && data.results ? data.results : [];
      setPool(results.slice(0, 40));
      setCurrent(0);
    } catch (e) { console.error(e); }
  }

  function reshuffle() {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setCurrent(0);
  }

  async function like(item: any) {
    try {
      // Save to Supabase 'likes' table
      const { data, error } = await supabase.from('likes').insert([{ movie_id: item.id, title: item.title }]);
      if (error) console.error('Supabase error', error);
      else console.log('Saved like', data);
      setCurrent((i) => i + 1);
    } catch (e) { console.error(e); setCurrent((i) => i + 1); }
  }

  function dislike(item: any) {
    setCurrent((i) => i + 1);
  }

  const item = pool[current];

  return (
    <View style={styles.container}>
      {item ? (
        <>
          <Image source={{ uri: item.poster || item.image || item.poster_path }} style={styles.poster} />
          <View style={styles.info}>
            <Text style={styles.rating}>{item.vote_average ?? item.rating}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.desc}>{item.overview ?? item.description}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={() => dislike(item)}><Text style={styles.btnText}>Dislike</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.like]} onPress={() => like(item)}><Text style={styles.btnText}>Like</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={reshuffle}><Text style={styles.btnText}>Reshuffle</Text></TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ color: '#fff' }}>No items</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 20 },
  poster: { width: width * 0.9, height: height * 0.6, resizeMode: 'cover', borderRadius: 12 },
  info: { position: 'absolute', bottom: 140, left: 20, width: width * 0.9 - 40 },
  rating: { color: '#fff', fontSize: 12, marginBottom: 4 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  desc: { color: '#ddd', fontSize: 14, marginTop: 6 },
  actions: { position: 'absolute', bottom: 40, flexDirection: 'row' },
  btn: { backgroundColor: '#222', padding: 12, borderRadius: 8, marginHorizontal: 8 },
  like: { backgroundColor: '#e50914' },
  btnText: { color: '#fff' }
});
