import { xmdbGet } from "../xmdbClient.js";

export default async function detailsHandler(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id required" });
    const data = await xmdbGet(`movie/${id}`, { append_to_response: "videos,credits" });
    res.json(data);
  } catch (err) {
    console.error("Details error:", err);
    res.status(502).json({ error: err.message });
  }
}
