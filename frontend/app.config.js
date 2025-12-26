const dotenv = require('dotenv');
dotenv.config();

export default {
  expo: {
    android: {
      package: "com.psgtatitos.bananaflick"
    },
    name: "BananaFlick",
    slug: "bananaflick",
    scheme: "com.psgtatitos.bananaflick",
    extra: {
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      eas: {
        projectId: "86dcb6a9-804a-4c8a-b68b-3a194768ef65"
      }
    }
  }
}
