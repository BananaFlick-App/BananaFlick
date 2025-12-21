// Edge Function: Handle user preferences (likes, dislikes, onboarding)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase-client.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const method = req.method;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // GET: Get user data, likes, or favorites
    if (method === "GET") {
      if (action === "likes" || action === "favorites") {
        // Get user record first
        const { data: userRecord } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("auth_user_id", userId)
          .single();

        if (!userRecord) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseAdmin
          .from("likes")
          .select("*")
          .eq("user_id", userRecord.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter out corrupted data (IDs that are '[object Object]')
        // This prevents the app from crashing when trying to load details for these invalid items
        const validData = (data || []).filter((item: any) =>
          item.item_id &&
          item.item_id !== '[object Object]' &&
          !item.item_id.includes('object')
        );

        return new Response(JSON.stringify(validData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "user") {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("auth_user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        return new Response(JSON.stringify(data || null), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST: Create/update user preferences
    if (method === "POST") {
      const body = await req.json();

      if (action === "like") {
        console.log('Processing like action');
        const { item_id, meta } = body;
        console.log('item_id:', item_id, 'meta:', meta);

        // Get or create user record
        let { data: userRecord } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("auth_user_id", userId)
          .single();
        console.log('userRecord found:', userRecord);

        if (!userRecord) {
          console.log('Creating new user record');
          const { data: newUser, error: createError } = await supabaseAdmin
            .from("users")
            .insert({ auth_user_id: userId, name: user.email || "User" })
            .select("id")
            .single();
          if (createError) {
            console.error('Error creating user:', createError);
            throw createError;
          }
          userRecord = newUser;
          console.log('New user created:', userRecord);
        }

        // Check if already liked
        const { data: existing } = await supabaseAdmin
          .from("likes")
          .select("id")
          .eq("user_id", userRecord.id)
          .eq("item_id", String(item_id))
          .single();
        console.log('Existing like:', existing);

        if (!existing) {
          console.log('Inserting new like');
          const { data, error } = await supabaseAdmin
            .from("likes")
            .insert({
              user_id: userRecord.id,
              item_id: String(item_id),
              meta: meta || {},
            })
            .select()
            .single();

          if (error) {
            console.error('Error inserting like:', error);
            throw error;
          }
          console.log('Like inserted:', data);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log('Like already exists');
        return new Response(JSON.stringify(existing), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "dislike") {
        const { item_id } = body;

        // Get or create user record
        let { data: userRecord } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("auth_user_id", userId)
          .single();

        if (!userRecord) {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from("users")
            .insert({ auth_user_id: userId, name: user.email || "User" })
            .select("id")
            .single();
          if (createError) throw createError;
          userRecord = newUser;
        }

        // Remove from likes if exists
        await supabaseAdmin
          .from("likes")
          .delete()
          .eq("user_id", userRecord.id)
          .eq("item_id", String(item_id));

        // Add to dislikes with 1 week hide period
        const hideUntil = new Date();
        hideUntil.setDate(hideUntil.getDate() + 7);

        const { data, error } = await supabaseAdmin
          .from("dislikes")
          .insert({
            user_id: userRecord.id,
            item_id: String(item_id),
            hide_until: hideUntil.toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "onboarding") {
        const { name, favorite_genres, location } = body;

        // Update or create user
        const { data: existing } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("auth_user_id", userId)
          .single();

        if (existing) {
          const { data, error } = await supabaseAdmin
            .from("users")
            .update({
              name,
              favorite_genres: favorite_genres || [],
              location: location || "US",
              onboarding_completed: true,
            })
            .eq("auth_user_id", userId)
            .select()
            .single();

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { data, error } = await supabaseAdmin
            .from("users")
            .insert({
              auth_user_id: userId,
              name,
              favorite_genres: favorite_genres || [],
              location: location || "US",
              onboarding_completed: true,
            })
            .select()
            .single();

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (action === "update-settings") {
        const { name, favorite_genres, location } = body;

        const { data, error } = await supabaseAdmin
          .from("users")
          .update({
            ...(name && { name }),
            ...(favorite_genres && { favorite_genres }),
            ...(location && { location }),
          })
          .eq("auth_user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

