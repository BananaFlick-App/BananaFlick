# BananaFlick - Movie Recommendation App

A React Native mobile app with Supabase Edge Functions backend for personalized movie recommendations.

## Features

- 🎬 **Personalized Recommendations**: Based on location, favorite genres, and liked movies
- ❤️ **Favorites System**: Save movies you like
- 👎 **Smart Dislikes**: Disliked movies are hidden for 1 week
- 🎯 **Onboarding**: One-time setup for name, genres, and location
- ⚙️ **Settings**: Update preferences anytime
- 🔄 **Reshuffle**: Get new movie recommendations
- 📱 **Swiper Interface**: Swipe through 5 movies at a time

## Backend (Supabase Edge Functions)

The backend is built as serverless Edge Functions that can be deployed to Supabase, so you don't need to keep a server running.

### Setup

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set Environment Variables**:
   Set secrets for XMDB API (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided):
   ```bash
   supabase secrets set XMDB_BASE_URL=https://api.xmdbapi.com
   supabase secrets set XMDB_API_KEY=your-xmdb-api-key
   ```
   Note: Supabase Edge Functions automatically have access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` - you don't need to set them as secrets.

5. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy movies
   supabase functions deploy movie-details
   supabase functions deploy user-preferences
   ```

### Database Setup

1. **Run migrations**:
   ```bash
   supabase db push
   ```
   Or manually run the SQL files in `backend/migrations/`:
   - `001_create_tables.sql`
   - `002_update_schema.sql`

### Edge Functions

- **`movies`**: Get movie recommendations, discover movies, get genres
- **`movie-details`**: Get detailed information about a specific movie
- **`user-preferences`**: Handle likes, dislikes, onboarding, and settings

## Frontend (React Native with Expo)

### Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `frontend` directory:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Update Supabase client**:
   Edit `frontend/src/supabaseClient.js` with your Supabase credentials.

4. **Run the app**:
   ```bash
   npm start
   ```

## Project Structure

```
BananaFlick/
├── backend/
│   ├── migrations/          # Database migrations
│   └── src/                 # Old Express backend (can be removed)
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── _shared/        # Shared utilities
│   │   ├── movies/         # Movie recommendations API
│   │   ├── movie-details/  # Movie details API
│   │   └── user-preferences/ # User preferences API
│   └── config.toml         # Supabase config
└── frontend/
    ├── src/
    │   ├── api/            # API client
    │   ├── screens/       # App screens
    │   └── supabaseClient.js
    └── App.js             # Main app component
```

## Key Features Implementation

### Recommendations Algorithm

1. Fetches movies based on user's favorite genres
2. Filters out disliked movies (hidden for 1 week)
3. Prioritizes movies similar to liked movies (by genre)
4. Uses location to show region-specific content

### Like/Dislike System

- **Like**: Saves to favorites, influences future recommendations
- **Dislike**: Hides movie for 1 week, removes from favorites if previously liked

### Onboarding

Shown only once, collects:
- User name
- Favorite genres (multiple selection)
- Location (country code)

## API Endpoints

All endpoints are accessed via Supabase Edge Functions:

- `GET /functions/v1/movies?action=recommend&userId={userId}` - Get recommendations
- `GET /functions/v1/movies?action=genres` - Get available genres
- `GET /functions/v1/movies?action=discover&genre={id}&region={code}&page={n}` - Discover movies
- `GET /functions/v1/movie-details?id={movieId}` - Get movie details
- `POST /functions/v1/user-preferences?action=like` - Like a movie
- `POST /functions/v1/user-preferences?action=dislike` - Dislike a movie
- `GET /functions/v1/user-preferences?action=favorites` - Get favorites
- `POST /functions/v1/user-preferences?action=onboarding` - Complete onboarding
- `POST /functions/v1/user-preferences?action=update-settings` - Update settings

## Database Schema

- **users**: User profiles with preferences
- **likes**: Liked movies (favorites)
- **dislikes**: Disliked movies with hide_until timestamp

## Production Deployment

1. **Deploy Edge Functions to Supabase** (as shown above)
2. **Update frontend API URLs** to point to your Supabase project
3. **Build and deploy mobile app**:
   ```bash
   expo build:android
   expo build:ios
   ```

## Notes

- The backend runs serverlessly on Supabase, so no server maintenance needed
- All API calls are authenticated via Supabase Auth
- Anonymous authentication is used for new users
- Recommendations are cached and optimized to stay within Supabase limits

