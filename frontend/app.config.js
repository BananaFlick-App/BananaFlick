import { SUPABASE_URL } from "./src/config/env";

export default {

  expo: {
    android: {
      package: "com.psgtatitos.bananaflick"
     },
    name: "BananaFlick",
    slug: "bananaflick",
    extra: {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
}
