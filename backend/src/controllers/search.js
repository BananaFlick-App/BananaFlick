import { xmdbGet } from "../xmdbClient.js";

export default async function searchHandler(req, res) {
  try {
    const q = req.query.q || req.query.query;
    if (!q) return res.status(400).json({ error: "q query param required" });
    const data = await xmdbGet("search/movie", { query: q, page: req.query.page || 1 });
    res.json(data);
  } catch (err) {
    console.error("Search error:", err);
    res.status(502).json({ error: err.message });
  }
}
