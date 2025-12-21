const dotenv = require('dotenv');
dotenv.config();

export default {
  expo: {
    android: {
      package: "com.psgtatitos.bananaflick"
    },
    name: "BananaFlick",
    slug: "bananaflick",
    extra: {
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseUrl: process.env.SUPABASE_URL
    }
  }
}
