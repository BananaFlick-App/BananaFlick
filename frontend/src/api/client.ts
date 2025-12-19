import axios from 'axios';
import { supabase } from '../supabaseClient';

const FUNCTIONS_URL =
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

const api = axios.create({
  baseURL: FUNCTIONS_URL,
  timeout: 15000,
});

/**
 * Attach Supabase access token automatically
 */
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export const apiClient = {
  /** Movies */
  getMovies: async (userId?: string, action = 'recommend') => {
    const res = await api.get('/movies', {
      params: { action, userId },
    });
    return res.data;
  },

  getGenres: async () => {
    const res = await api.get('/movies', {
      params: { action: 'genres' },
    });
    return res.data;
  },

  /** Likes */
  likeMovie: async (movieId: string | number, meta: any) => {
    const res = await api.post(
      '/user-preferences',
      {
        item_id: String(movieId),
        meta,
      },
      { params: { action: 'like' } }
    );
    return res.data;
  },

  /** Dislikes */
  dislikeMovie: async (movieId: string | number) => {
    const res = await api.post(
      '/user-preferences',
      {
        item_id: String(movieId),
      },
      { params: { action: 'dislike' } }
    );
    return res.data;
  },

  /** Favorites */
  getFavorites: async () => {
    const res = await api.get('/user-preferences', {
      params: { action: 'favorites' },
    });
    return res.data;
  },

  /** Onboarding */
  completeOnboarding: async (
    name: string,
    favoriteGenres: string[],
    location: string
  ) => {
    const res = await api.post(
      '/user-preferences',
      {
        name,
        favorite_genres: favoriteGenres,
        location,
      },
      { params: { action: 'onboarding' } }
    );
    return res.data;
  },

  /** Settings */
  updateSettings: async (updates: {
    name?: string;
    favorite_genres?: string[];
    location?: string;
  }) => {
    const res = await api.post(
      '/user-preferences',
      updates,
      { params: { action: 'update-settings' } }
    );
    return res.data;
  },
};

export { api };
