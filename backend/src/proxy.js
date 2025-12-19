// Simple proxy to XMDB. Keeps API key in server.
// NOTE: adjust path/params depending on xmdb api format (this assumes endpoints like /discover, /search, /genres, /details/:id)
const axios = require('axios');
const https = require('https');
const crypto = require('crypto');

const API_KEY = process.env.XMDB_API_KEY;
const BASE = process.env.XMDB_BASE_URL || 'https://xmdbapi.com';

// Use https agent to help with some TLS quirks in dev (only if needed)
const httpsAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
});

function buildUrl(path, params = {}) {
  // Path may be like '/discover' or '/details/ID'
  const url = new URL(path, BASE);
  url.searchParams.set('apikey', API_KEY);
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null) url.searchParams.set(k, params[k]);
  });
  return url.toString();
}

async function callXmdb(path, params) {
  if (!API_KEY) throw new Error('Missing XMDB_API_KEY in env');
  const url = buildUrl(path, params);
  const res = await axios.get(url, { httpsAgent, timeout: 10000 });
  return res.data;
}

exports.genres = async (req, res) => {
  try {
    const data = await callXmdb('/genres', {});
    res.json(data);
  } catch (e) {
    console.error('genres proxy error', e.message || e);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
};

exports.discover = async (req, res) => {
  try {
    // expected query: ?genre=Action&region=US&page=1
    const params = { genre: req.query.genre, region: req.query.region, page: req.query.page || 1 };
    const data = await callXmdb('/discover', params);
    res.json(data);
  } catch (e) {
    console.error('discover proxy error', e.message || e);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
};

exports.search = async (req, res) => {
  try {
    const params = { q: req.query.q || req.query.query || '' };
    const data = await callXmdb('/search', params);
    res.json(data);
  } catch (e) {
    console.error('search proxy error', e.message || e);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
};

exports.details = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await callXmdb(`/details/${encodeURIComponent(id)}`, {});
    res.json(data);
  } catch (e) {
    console.error('details proxy error', e.message || e);
    res.status(502).json({ error: 'upstream_failed', message: e.message });
  }
};
