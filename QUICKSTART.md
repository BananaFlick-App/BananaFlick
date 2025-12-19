# Quick Start Guide

## Prerequisites
- Node.js installed
- Supabase account (free tier works)
- XMDB API key from xmdbapi.com

## 5-Minute Setup

### 1. Supabase Setup (2 minutes)

**Option A: Using Scoop (Recommended for Windows)**
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option B: Using Chocolatey**
```powershell
# Install via Chocolatey
choco install supabase
```

**Option C: Using npx (No installation needed)**
```bash
# Use npx to run commands without installing
npx supabase login
npx supabase link --project-ref your-project-ref
```

**Option D: Download Binary**
1. Go to https://github.com/supabase/cli/releases
2. Download `supabase_windows_amd64.zip` (or appropriate for your system)
3. Extract and add to PATH, or use directly

After installation, verify it works:
```bash
supabase --version
```

Then login and link:
```bash
# Login
supabase login

# Link your project (get project-ref from Supabase dashboard)
supabase link --project-ref your-project-ref
```

### 2. Database Setup (1 minute)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and run `backend/migrations/001_create_tables.sql`
3. Copy and run `backend/migrations/002_update_schema.sql`

### 3. Deploy Edge Functions (1 minute)
```bash
# Set secrets
supabase secrets set XMDB_BASE_URL=https://api.xmdbapi.com
supabase secrets set XMDB_API_KEY=your-xmdb-key
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Deploy
supabase functions deploy movies
supabase functions deploy movie-details
supabase functions deploy user-preferences
```

### 4. Frontend Setup (1 minute)
```bash
cd frontend

# Create .env file
echo "EXPO_PUBLIC_SUPABASE_URL=your-supabase-url" > .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" >> .env

# Install and run
npm install
npm start
```

## Where to Get Keys

- **Supabase URL & Keys**: Dashboard → Settings → API
- **XMDB API Key**: Sign up at xmdbapi.com

## Test It Works

1. Open the app
2. Complete onboarding (name, genres, location)
3. Swipe through movies
4. Like a movie → Check Favorites tab
5. Dislike a movie → It won't show for 1 week

## Troubleshooting

**Functions not deploying?**
- Check you're logged in: `supabase projects list`
- Verify secrets: `supabase secrets list`

**Frontend can't connect?**
- Check `.env` file exists
- Verify URLs don't have trailing slashes
- Check Expo console for errors

**No movies showing?**
- Verify XMDB API key is correct
- Check Edge Function logs: `supabase functions logs movies`

## Next Steps

- Customize the UI in `frontend/src/screens/`
- Adjust recommendation algorithm in `supabase/functions/movies/index.ts`
- Add more features!

