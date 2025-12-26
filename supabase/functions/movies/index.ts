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

        // Get user's liked movies to find similar ones AND to exclude them from recommendations
        const { data: likes } = await supabaseAdmin
          .from("likes")
          .select("item_id, meta")
          .eq("user_id", userRecord.id);

        // Get disliked movies to exclude
        const { data: dislikes } = await supabaseAdmin
          .from("dislikes")
          .select("item_id")
          .eq("user_id", userRecord.id)
          .gt("hide_until", new Date().toISOString());

        const excludedIds = new Set([
          ...(likes?.map((l) => String(l.item_id)) || []),
          ...(dislikes?.map((d) => String(d.item_id)) || [])
        ]);

        // Get movies based on favorite genres
        const region = user.location || "US";
        const genres = user.favorite_genres || [];

        let allMovies: XMDBMovie[] = [];

        // Fetch movies for each favorite genre with some randomness
        for (const genre of genres.slice(0, 5)) { // Top 5 genres
          try {
            const data = await discoverMovies({
              with_genres: genre,
              region,
              page: Math.floor(Math.random() * 5) + 1,
            });
            allMovies = [...allMovies, ...(data.results || [])];
          } catch (e) {
            console.error(`Error fetching genre ${genre}:`, e);
          }
        }

        // If still too few movies, get popular movies for the region
        if (allMovies.length < 20) {
          console.log('Fetching regional trending movies to fill pool');
          const data = await discoverMovies({ region, page: Math.floor(Math.random() * 3) + 1 });
          allMovies = [...allMovies, ...(data.results || [])];
        }

        // Create a set of favorite genre IDs for fast lookup
        const favoriteGenreSet = new Set(genres.map(g => String(g)));
        console.log('[Recommend] Favorite Genre IDs:', Array.from(favoriteGenreSet));

        // Score and filter the movies
        const scoredMovies = allMovies.map(movie => {
          let score = 0;
          const movieGenreIds = (movie.genre_ids || []).map(id => String(id));

          // Bonus for matching favorite genres
          movieGenreIds.forEach(id => {
            if (favoriteGenreSet.has(id)) {
              score += 10;
              console.log(`[Recommend] Movie ${movie.title} (ID: ${movie.id}) matched favorite genre ID: ${id}`);
            }
          });

          // Bonus for matching genres from liked movies
          if (likes && likes.length > 0) {
            likes.forEach(like => {
              const likedGenreIds = (like.meta?.genre_ids || []).map((id: any) => String(id));
              movieGenreIds.forEach(id => {
                if (likedGenreIds.includes(id)) {
                  score += 5;
                  console.log(`[Recommend] Movie ${movie.title} (ID: ${movie.id}) matched liked movie genre ID: ${id}`);
                }
              });
            });
          }

          // Small random factor for variety
          score += Math.random() * 5;

          return { ...movie, score };
        });

        // Filter out session excluded IDs
        let validMovies = scoredMovies.filter(m => !excludedIds.has(String(m.id)));

        // Strictly prioritize movies that match at least one favorite genre
        let filteredMovies = validMovies.filter(m => m.score >= 10);

        console.log(`[Recommend] Pool size: ${validMovies.length}, Strict matches: ${filteredMovies.length}`);

        // If pool is still too small, add the best of the generic ones but keep them lower in the list
        if (filteredMovies.length < 10) {
          console.log('[Recommend] Strict matches insufficient, adding best available from pool');
          const others = validMovies
            .filter(m => !filteredMovies.some(f => f.id === m.id))
            .sort((a, b) => (b.score || 0) - (a.score || 0));

          filteredMovies = [...filteredMovies, ...others];
        }

        // Sort by final score descending and take top 20
        const finalResults = filteredMovies
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 20);

        console.log('[Recommend] Final results:', finalResults.map(m => `${m.title} (${m.score.toFixed(1)})`));

        return new Response(
          JSON.stringify({
            results: finalResults,
            page: 1,
            total_results: finalResults.length,
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

