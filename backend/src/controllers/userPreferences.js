import { supabaseAdmin } from "../supabaseClient.js";

/*
Tables assumed:
- users (id uuid primary key, name text, created_at)
- likes (id serial, user_id uuid, item_id text, meta jsonb, created_at)
- dislikes (id serial, user_id uuid, item_id text, meta jsonb, created_at)
*/

export async function saveLike(req, res) {
  try {
    const { user_id, item_id, meta } = req.body;
    if (!user_id || !item_id) return res.status(400).json({ error: "user_id and item_id required" });

    const { data, error } = await supabaseAdmin
      .from("likes")
      .insert([{ user_id, item_id, meta }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error("saveLike error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function saveDislike(req, res) {
  try {
    const { user_id, item_id, meta } = req.body;
    if (!user_id || !item_id) return res.status(400).json({ error: "user_id and item_id required" });

    const { data, error } = await supabaseAdmin
      .from("dislikes")
      .insert([{ user_id, item_id, meta }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error("saveDislike error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const { id, name } = req.body; // id optional (uuid) or generate here
    if (!name) return res.status(400).json({ error: "name required" });

    const payload = { name };
    if (id) payload.id = id;

    const { data, error } = await supabaseAdmin.from("users").insert([payload]).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getUserLikes(req, res) {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    const { data, error } = await supabaseAdmin.from("likes").select("*").eq("user_id", user_id);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("getUserLikes error:", err);
    res.status(500).json({ error: err.message });
  }
}
