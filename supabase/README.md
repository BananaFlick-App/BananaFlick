# Supabase Edge Functions

This directory contains the serverless backend functions for BananaFlick.

## Deployment

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set secrets** (environment variables):
   ```bash
   supabase secrets set XMDB_BASE_URL=https://api.xmdbapi.com
   supabase secrets set XMDB_API_KEY=your-api-key
   ```
   Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase Edge Functions - you don't need to set them as secrets. The CLI will skip any secrets starting with `SUPABASE_`.

5. **Deploy functions**:
   ```bash
   supabase functions deploy movies
   supabase functions deploy movie-details
   supabase functions deploy user-preferences
   ```

## Local Development

1. **Start Supabase locally**:
   ```bash
   supabase start
   ```

2. **Serve functions locally**:
   ```bash
   supabase functions serve movies
   supabase functions serve movie-details
   supabase functions serve user-preferences
   ```

## Functions

### movies
- `GET ?action=recommend&userId={id}` - Get personalized recommendations
- `GET ?action=genres` - Get available genres
- `GET ?action=discover&genre={id}&region={code}&page={n}` - Discover movies

### movie-details
- `GET ?id={movieId}` - Get detailed movie information

### user-preferences
- `GET ?action=favorites` - Get user's favorite movies
- `GET ?action=user` - Get user profile
- `POST ?action=like` - Like a movie
- `POST ?action=dislike` - Dislike a movie (hides for 1 week)
- `POST ?action=onboarding` - Complete onboarding
- `POST ?action=update-settings` - Update user settings

