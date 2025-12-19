import axios from "axios";
import https from "https";
import crypto from "crypto";

const base = process.env.XMDB_BASE_URL;
const key = process.env.XMDB_API_KEY;

if (!base || !key) {
  console.warn("XMDB_BASE_URL or XMDB_API_KEY missing - discovery/search/details will fail until set.");
}

// This agent adds TLS legacy support for dev if needed. Keep secureOptions but do NOT disable verification in prod.
const httpsAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  // rejectUnauthorized: true // keep default
});

export async function xmdbGet(path, query = {}) {
  const params = { apikey: key, ...query };
  const url = `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const res = await axios.get(url, { params, httpsAgent, timeout: 10000 });
  return res.data;
}
