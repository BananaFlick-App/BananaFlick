// XMDB API Client for Edge Functions
const XMDB_BASE_URL = Deno.env.get("XMDB_BASE_URL") || "https://xmdbapi.com/api/v1";
const XMDB_API_KEY = Deno.env.get("XMDB_API_KEY") || "";
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

  // XMDB API uses x-api-key header for authentication
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query).map(([k, v]) => [k, String(v)])
    )
  );

  const url = `${XMDB_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}?${params.toString()}`;

  console.log(`[XMDB] Fetching: ${path}`);
  console.log(`[XMDB] Full URL: ${url}`);
  console.log(`[XMDB] API Key status - present: ${!!XMDB_API_KEY}, length: ${XMDB_API_KEY.length}, starts with: ${XMDB_API_KEY.substring(0, 4)}...`);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "x-api-key": XMDB_API_KEY,
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

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export function getGenreIdByName(name: string): number | undefined {
  const entry = Object.entries(GENRE_MAP).find(([_, v]) => v.toLowerCase() === name.toLowerCase());
  return entry ? parseInt(entry[0]) : undefined;
}

export function getGenreNameById(id: number | string): string | undefined {
  return GENRE_MAP[parseInt(String(id))];
}

export async function getGenres(): Promise<any> {
  // Return static genre list for now
  return {
    genres: Object.entries(GENRE_MAP).map(([id, name]) => ({ id: parseInt(id), name }))
  };
}

export async function discoverMovies(params: {
  page?: number;
  region?: string;
  with_genres?: string | number;
  sort_by?: string;
}): Promise<XMDBResponse> {
  try {
    const queryParams: Record<string, any> = {
      count: 100, // Fetch more for better filtering/variety
      page: params.page || 1
    };
    if (params.region) queryParams.region = params.region;

    // Handle genre filtering - the API might prefer names or our IDs might need mapping
    if (params.with_genres) {
      const genreName = getGenreNameById(params.with_genres);
      queryParams.with_genres = genreName || String(params.with_genres);
    }

    if (params.sort_by) queryParams.sort_by = params.sort_by;

    const response = await xmdbGet("trending", queryParams);

    // Transform XMDB response to match expected format
    const movies = (response.results || []).map((item: any) => {
      // Convert response genres (strings) back to our numeric IDs for consistency
      const genreIds = (item.genres || []).map((g: any) => {
        if (typeof g === 'number') return g;
        if (typeof g === 'string') return getGenreIdByName(g);
        if (typeof g === 'object' && g.id) return g.id;
        if (typeof g === 'object' && g.name) return getGenreIdByName(g.name);
        return undefined;
      }).filter((id: any) => id !== undefined);

      return {
        id: item.id,
        title: item.title,
        poster_path: item.poster_url,
        overview: item.plot,
        release_date: item.release_year ? `${item.release_year}-01-01` : null,
        vote_average: item.rating,
        genre_ids: genreIds,
        backdrop_path: null,
      };
    });

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
      poster_path: item.poster_url,
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

export async function getMovieDetails(id: string | number): Promise<XMDBMovie> {
  try {
    // Verified endpoint: /api/v1/movies/{id}
    const response = await xmdbGet(`movies/${id}`);

    // Transform to match expected format
    return {
      id: response.id,
      title: response.title || 'Unknown Title',
      poster_path: response.poster_url,
      backdrop_path: response.backdrop_url,
      overview: response.plot || '',
      release_date: response.release_year ? `${response.release_year}-01-01` : null,
      vote_average: typeof response.rating === 'number' ? response.rating : 0,
      genre_ids: Array.isArray(response.genres) ? response.genres.map((g: any) => (typeof g === 'object' ? g.id : 0)) : [],
      runtime: response.runtime_minutes || 0,
      genres: Array.isArray(response.genres) ? response.genres.map((g: any) => ({ id: 0, name: typeof g === 'string' ? g : g.name })) : [],
    } as XMDBMovie;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id} from XMDB:`, error);
    throw error;
  }
}

