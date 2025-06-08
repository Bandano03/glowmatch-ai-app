export default {
  expo: {
    name: "glowmatch-ai-app",
    slug: "glowmatch-ai-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    owner: "bandano",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.glowmatch.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.glowmatch.app"
    },
    plugins: [
      "expo-camera",
      "expo-dev-client",
      [
        "expo-build-properties",
        {
          "android": {
            "kotlinVersion": "1.9.22"
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "ae2b467c-16f5-4312-9b6f-188a601fe889"
      }
    }
  }
};