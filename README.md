# ReadMe - Immersive Android PDF Book Reader

**ReadMe** is a full-featured, offline-first Android PDF book reader built with **Expo**, **TypeScript**, **Expo Router**, and **EAS**, heavily inspired by **Mihon** (https://mihon.app/).

## 🚀 Features

- **Multi-Library Categories**: Organize books into custom category tabs (*All*, *Currently Reading*, *Favorites*, *Tech & Code*, *Comics*, *Completed*).
- **Mihon Reader Engine**: Supports both **Long Strip** (continuous vertical webtoon scrolling) and **Single Page Swipe** modes.
- **Reader Themes**: OLED Pitch Black (`#000000`), Mihon Dark, Sepia, and Light.
- **Mihon Overlay Controls**: Center-tap gesture overlay HUD with scrubbable page slider, page jump dialog, and bookmarking.
- **Offline Data Storage**: All progress, bookmarks, and settings stored locally using `AsyncStorage` + `expo-file-system`.
- **Backup Export & Import**: Export library and reading progress to `readme_backup.json` and restore on any device.
- **EAS Build Ready**: Configured for Android APK (`npm run eas-build:apk`) and Google Play AAB (`npm run eas-build:aab`).

## 🛠️ Development & Building

```bash
# Start development server
npm start

# Run on Android
npm run android

# Build Android APK (EAS)
npm run eas-build:apk

# Build Google Play AAB (EAS)
npm run eas-build:aab
```
