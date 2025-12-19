// Edge Function: Get movies with recommendations based on user preferences
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-client.ts";
import { discoverMovies, getGenres, XMDBMovie } from "../_shared/xmdb-client.ts";
serve(async (req) => {
  console.log('Request received, method:', req.method, 'url:', req.url);
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action") || "recommend"; // recommend, discover, genres

    if (action === "genres") {
      console.log('Getting genres');
      try {
        const genres = await getGenres();
        console.log('Genres fetched successfully:', genres?.genres?.length || 'unknown count');
        return new Response(JSON.stringify(genres), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error fetching genres:", error);
        // Return error details for debugging
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error("Full error:", { message: errorMessage, stack: errorStack });
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            message: "Failed to fetch genres from XMDB API. Check logs for details.",
            stack: errorStack
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (action === "discover") {
      try {
        const genre = url.searchParams.get("genre");
        const region = url.searchParams.get("region") || "US";
        const page = parseInt(url.searchParams.get("page") || "1");

        const params: any = { page, region };
        if (genre) params.with_genres = genre;

        console.log('Discovering movies with params:', { ...params, with_genres: params.with_genres ? 'set' : 'not set' });
        const data = await discoverMovies(params);
        console.log('Discover movies success, got', data.results?.length || 0, 'movies');
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error discovering movies:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            message: "Failed to discover movies from XMDB API"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Recommendation logic
    if (action === "recommend" && userId) {
      try {
        // Get user preferences
        const { data: user, error: userError } = await supabaseAdmin
          .from("users")
          .select("favorite_genres, location")
          .eq("auth_user_id", userId)
          .single();

        if (userError || !user) {
          console.log('User not found or error, using default recommendations');
          try {
            // Fallback to default recommendations
            const data = await discoverMovies({ page: 1, region: "US" });
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (fallbackError) {
            console.error("Error in fallback discoverMovies:", fallbackError);
            throw fallbackError;
          }
        }

      // Get user record
      const { data: userRecord } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

        if (!userRecord) {
          console.log('User record not found, using default recommendations');
          try {
            // Fallback to default recommendations
            const data = await discoverMovies({ page: 1, region: "US" });
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (fallbackError) {
            console.error("Error in fallback discoverMovies:", fallbackError);
            throw fallbackError;
          }
        }

      // Get user's liked movies to find similar ones
      const { data: likes } = await supabaseAdmin
        .from("likes")
        .select("item_id, meta")
        .eq("user_id", userRecord.id)
        .limit(10);

      // Get disliked movies to exclude
      const { data: dislikes } = await supabaseAdmin
        .from("dislikes")
        .select("item_id")
        .eq("user_id", userRecord.id)
        .gt("hide_until", new Date().toISOString());

      const dislikedIds = new Set(dislikes?.map((d) => d.item_id) || []);

      // Get movies based on favorite genres
      const region = user.location || "US";
      const genres = user.favorite_genres || [];
      
      let allMovies: XMDBMovie[] = [];
      
      // Fetch movies for each favorite genre
      for (const genre of genres.slice(0, 3)) {
        try {
          const data = await discoverMovies({
            with_genres: genre,
            region,
            page: 1,
          });
          allMovies = [...allMovies, ...(data.results || [])];
        } catch (e) {
          console.error(`Error fetching genre ${genre}:`, e);
        }
      }

        // If no genres, get popular movies
        if (allMovies.length === 0) {
          console.log('No genres configured, fetching popular movies');
          const data = await discoverMovies({ region, page: 1 });
          allMovies = data.results || [];
        }

      // Filter out disliked movies
      allMovies = allMovies.filter((m) => !dislikedIds.has(String(m.id)));

      // If user has likes, prioritize similar movies (by genre)
      if (likes && likes.length > 0) {
        const likedGenres = new Set<number>();
        likes.forEach((like) => {
          if (like.meta?.genre_ids) {
            like.meta.genre_ids.forEach((id: number) => likedGenres.add(id));
          }
        });

        // Sort movies by genre match
        allMovies.sort((a, b) => {
          const aMatch = a.genre_ids?.some((id) => likedGenres.has(id)) ? 1 : 0;
          const bMatch = b.genre_ids?.some((id) => likedGenres.has(id)) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

        // Shuffle and limit to 20
        const shuffled = allMovies.sort(() => Math.random() - 0.5).slice(0, 20);
        console.log('Recommendations success, returning', shuffled.length, 'movies');

        return new Response(
          JSON.stringify({
            results: shuffled,
            page: 1,
            total_results: shuffled.length,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error in recommendation logic:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            message: "Failed to get recommendations from XMDB API"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Default: return popular movies
    try {
      console.log('Fetching default popular movies');
      const data = await discoverMovies({ page: 1, region: "US" });
      console.log('Default movies success, got', data.results?.length || 0, 'movies');
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching default movies:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          message: "Failed to fetch movies from XMDB API"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

