import { xmdbGet } from "../xmdbClient.js";

/*
  GET /api/discover?genre=Action&region=US&page=1
  This proxies to XMDb discover/search endpoint. We fetch a reasonable page and return results.
*/
export default async function discovery(req, res) {
  try {
    const { genre, region, page = 1 } = req.query;
    // Map your params to the XMDb endpoint as required.
    // Example: xmdb has a discover path: /discover/movie
    const params = { page, region };
    if (genre) params.with_genres = genre; // or map genre name to id if required

    const data = await xmdbGet("discover/movie", params);
    return res.json(data);
  } catch (err) {
    console.error("Discovery error:", err.message || err);
    return res.status(502).json({ error: "Failed to fetch discovery", details: err.message });
  }
}
