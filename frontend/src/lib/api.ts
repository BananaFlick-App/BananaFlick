import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("❌ EXPO_PUBLIC_API_URL is not set");
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});
