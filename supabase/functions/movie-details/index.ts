// Edge Function: Get movie details by ID
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getMovieDetails } from "../_shared/xmdb-client.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const movieId = url.searchParams.get("id");

    if (!movieId) {
      return new Response(
        JSON.stringify({ error: "Movie ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const movie = await getMovieDetails(movieId);

    return new Response(JSON.stringify(movie), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const url = new URL(req.url);
    const movieId = url.searchParams.get("id");
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        debug: {
          receivedId: movieId,
          type: typeof movieId
        }
      }),

      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

