# Deployment Guide

## Quick Start

### 1. Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Note your project URL and anon key from Settings > API

### 2. Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Run backend/migrations/001_create_tables.sql
-- Run backend/migrations/002_update_schema.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 3. Deploy Edge Functions

**Install Supabase CLI** (choose one method):

**Windows (Scoop - Recommended):**
```powershell
# Install Scoop if needed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Windows (Chocolatey):**
```powershell
choco install supabase
```

**Or use npx (no installation):**
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
```

**Then:**
```bash
# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Set secrets (Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically provided by Supabase, no need to set them)
supabase secrets set XMDB_BASE_URL=https://api.xmdbapi.com
supabase secrets set XMDB_API_KEY=your-xmdb-api-key
# Optional: If you need custom names, use different variable names
# supabase secrets set YOUR_SUPABASE_URL=your-supabase-url
# supabase secrets set YOUR_SERVICE_ROLE_KEY=your-service-role-key

# Deploy functions
supabase functions deploy movies
supabase functions deploy movie-details
supabase functions deploy user-preferences
```

### 4. Frontend Configuration

1. Create `.env` file in `frontend/` directory:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. Update `frontend/src/supabaseClient.js` if needed

3. Install dependencies:
```bash
cd frontend
npm install
```

4. Run the app:
```bash
npm start
```

## Environment Variables

### Supabase Secrets (Edge Functions)
- `XMDB_BASE_URL`: XMDB API base URL (usually https://api.xmdbapi.com)
- `XMDB_API_KEY`: Your XMDB API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (from Settings > API)

### Frontend Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (from Settings > API)

## Testing

1. **Test Edge Functions locally**:
   ```bash
   supabase functions serve movies
   ```

2. **Test API endpoints**:
   ```bash
   curl "http://localhost:54321/functions/v1/movies?action=genres"
   ```

## Production Checklist

- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Environment variables set
- [ ] Frontend environment variables configured
- [ ] Test onboarding flow
- [ ] Test like/dislike functionality
- [ ] Test recommendations
- [ ] Test favorites
- [ ] Test settings update

## Troubleshooting

### Edge Functions not working
- Check secrets are set: `supabase secrets list`
- Check function logs: `supabase functions logs movies`

### Frontend can't connect
- Verify `EXPO_PUBLIC_SUPABASE_URL` is correct
- Check network requests in browser/device console
- Ensure CORS is enabled in Supabase

### Database errors
- Verify migrations ran successfully
- Check table permissions in Supabase dashboard
- Ensure RLS policies allow access if using Row Level Security

