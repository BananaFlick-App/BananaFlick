// XMDB API Client for Edge Functions
const XMDB_BASE_URL = Deno.env.get("XMDB_BASE_URL") || "https://xmdbapi.com/api/v1";const XMDB_API_KEY = Deno.env.get("XMDB_API_KEY") || "";
const API_KEY = Deno.env.get('XMDB_API_KEY');

export interface XMDBMovie {
  id: number;
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  [key: string]: any;
}

export interface XMDBResponse {
  results: XMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export async function xmdbGet(path: string, query: Record<string, any> = {}): Promise<any> {
  if (!XMDB_API_KEY || XMDB_API_KEY.trim() === '') {
    const errorMsg = "XMDB_API_KEY is not configured or is empty. Please set it in Supabase secrets using: supabase secrets set XMDB_API_KEY=your-key. Then redeploy the function.";
    console.error(errorMsg);
    console.error(`[XMDB] Current XMDB_API_KEY value: "${XMDB_API_KEY}"`);
    throw new Error(errorMsg);
  }
  
  // XMDB API uses Authorization: Bearer header for authentication
  // Build query parameters (without api_key)
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query).map(([k, v]) => [k, String(v)])
    )
  );
  
  const url = `${XMDB_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log(`[XMDB] Fetching: ${path}`);
  console.log(`[XMDB] Full URL: ${url}`);
  console.log(`[XMDB] API Key status - present: ${!!XMDB_API_KEY}, length: ${XMDB_API_KEY.length}, starts with: ${XMDB_API_KEY.substring(0, 4)}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${XMDB_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[XMDB] API error ${response.status}: ${errorText}`);
      throw new Error(`XMDB API error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    console.log(`[XMDB] Success: ${path}, got ${data.results?.length || 1} items`);
    return data;
  } catch (error) {
    console.error(`[XMDB] Request failed for ${path}:`, error);
    throw error;
  }
}

export async function getGenres(): Promise<any> {
  // Return static genre list for now
  return {
    genres: [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 36, name: "History" },
      { id: 27, name: "Horror" },
      { id: 10402, name: "Music" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Science Fiction" },
      { id: 10770, name: "TV Movie" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "War" },
      { id: 37, name: "Western" }
    ]
  };
}

export async function discoverMovies(params: {
  page?: number;
  region?: string;
  with_genres?: string;
  sort_by?: string;
}): Promise<XMDBResponse> {
  try {
    // XMDB API uses /trending endpoint for popular movies
    // Use /search endpoint for searching/discovering movies
    const queryParams: Record<string, any> = {};
    
    // Use count for pagination (max 50)
    const count = Math.min(50, (params.page || 1) * 20);
    queryParams.count = count;
    
    // For genre filtering, we'll need to use search with genre parameter
    // But for now, let's use trending which gives popular movies
    const response = await xmdbGet("trending", queryParams);
    
    // Transform XMDB response to match expected format
    const movies = (response.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      poster_path: item.poster_url ? item.poster_url.replace(/^https?:\/\/[^/]+/, '') : null,
      overview: item.plot,
      release_date: item.release_year ? `${item.release_year}-01-01` : null,
      vote_average: item.rating,
      genre_ids: item.genres?.map((g: any) => g.id || g) || [],
      backdrop_path: null,
    }));
    
    return {
      results: movies,
      page: params.page || 1,
      total_pages: response.has_next_page ? (params.page || 1) + 1 : (params.page || 1),
      total_results: movies.length
    };
  } catch (error) {
    console.error("Error fetching movies from XMDB:", error);
    throw error;
  }
}

export async function searchMovies(query: string, page: number = 1): Promise<XMDBResponse> {
  try {
    const response = await xmdbGet("search", {
      q: query,
      limit: 20
    });
    
    // Transform XMDB response to match expected format
    const movies = (response.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      poster_path: item.poster_url ? item.poster_url.replace(/^https?:\/\/[^/]+/, '') : null,
      overview: item.plot,
      release_date: item.release_year ? `${item.release_year}-01-01` : null,
      vote_average: item.rating,
      genre_ids: item.genres?.map((g: any) => g.id || g) || [],
      backdrop_path: null,
    }));
    
    return {
      results: movies,
      page: page,
      total_pages: 1,
      total_results: movies.length
    };
  } catch (error) {
    console.error("Error searching movies from XMDB:", error);
    throw error;
  }
}

export async function getMovieDetails(id: number): Promise<XMDBMovie> {
  try {
    // XMDB API might use /title/{id} or /movie/{id}
    // Try /title/{id} first as that's more common in XMDB-style APIs
    try {
      const response = await xmdbGet(`title/${id}`);
      // Transform to match expected format
      return {
        id: response.id,
        title: response.title,
        poster_path: response.poster_url ? response.poster_url.replace(/^https?:\/\/[^/]+/, '') : null,
        backdrop_path: response.backdrop_url ? response.backdrop_url.replace(/^https?:\/\/[^/]+/, '') : null,
        overview: response.plot,
        release_date: response.release_year ? `${response.release_year}-01-01` : null,
        vote_average: response.rating,
        genre_ids: response.genres?.map((g: any) => g.id || g) || [],
        runtime: response.runtime_minutes,
        genres: response.genres || [],
      } as XMDBMovie;
    } catch (e) {
      // Fallback to /movie/{id} if /title/{id} doesn't work
      const response = await xmdbGet(`movie/${id}`);
      return response as XMDBMovie;
    }
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id} from XMDB:`, error);
    throw error;
  }
}

