import axios from 'axios';
import { supabase } from '../supabaseClient';
import { SUPABASE_URL } from '../config/env';
const FUNCTIONS_URL =
  `${SUPABASE_URL}/functions/v1`;

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
  getMovies: async (userId?: string, action = 'recommend', extraParams = {}) => {
    const res = await api.get('/movies', {
      params: { action, userId, ...extraParams },
    });
    return res.data;
  },

  getMovieDetails: async (id: string | number) => {
    const res = await api.get('/movie-details', {
      params: { id },
    });
    return res.data;
  },

  /** Genres */
  getGenres: async () => {
    const res = await api.get('/movies', {
      params: { action: 'genres' },
    });
    return res.data;
  },

  /** Discover movies */
  discoverMovies: async (genre?: string, region?: string, page?: number) => {
    const res = await api.get('/movies', {
      params: {
        action: 'discover',
        genre,
        region,
        page,
      },
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

  /** Unlikes (Remove from Favorites) */
  unlikeMovie: async (movieId: string | number) => {
    const res = await api.post(
      '/user-preferences',
      {
        item_id: String(movieId),
      },
      { params: { action: 'unlike' } }
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

  /** Seen tracking (Persist 24h) */
  markMoviesSeen: async (movieIds: (string | number)[]) => {
    const res = await api.post(
      '/user-preferences',
      {
        item_ids: movieIds.map(id => String(id)),
      },
      { params: { action: 'mark-seen' } }
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
  /** User */
  getUser: async () => {
    const res = await api.get('/user-preferences', {
      params: { action: 'user' },
    });
    return res.data;
  },
};

export { api };
