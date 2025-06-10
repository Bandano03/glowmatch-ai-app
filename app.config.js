{
  "expo": {
    "name": "GlowMatch AI",
    "slug": "glowmatch-ai-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.glowmatch.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.glowmatch.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Diese App benötigt Kamerazugriff für Beauty-Analysen."
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Diese App benötigt Zugriff auf Ihre Fotos für Beauty-Analysen.",
          "savePhotosPermission": "Diese App möchte Analysebilder in Ihrer Galerie speichern."
        }
      ]
    ]
  }
}
