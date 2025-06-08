import 'dotenv/config';

export default {
  expo: {
    name: "GlowMatch AI",
    slug: "glowmatch-ai-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6b46c1"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.glowmatch.ai"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6b46c1"
      },
      package: "com.glowmatch.ai"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-camera",
        {
          cameraPermission: "Diese App benötigt Kamerazugriff für Beauty-Analysen."
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Diese App benötigt Zugriff auf Ihre Fotos für Beauty-Analysen.",
          savePhotosPermission: "Diese App möchte Analysebilder in Ihrer Galerie speichern."
        }
      ]
    ],
    extra: {
      OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT || '30000',
      eas: {
        projectId: "your-project-id-here"
      }
    }
  }
};