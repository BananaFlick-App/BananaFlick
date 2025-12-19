import { xmdbGet } from "../xmdbClient.js";

export default async function genresHandler(req, res) {
  try {
    const data = await xmdbGet("genre/movie/list");
    res.json(data);
  } catch (err) {
    console.error("Genres error:", err);
    res.status(502).json({ error: err.message });
  }
}
