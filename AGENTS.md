# Agent Guidelines & Repository Rules for ReadMe

## ⚡ Framework & Version Rules
- **Expo Version**: Expo SDK 57 (React Native 0.86, React 19).
- **Documentation**: Read exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing code.
- **Routing**: Expo Router file-based routing (`src/app/`).
- **Core Skills Guide**: Refer to [SKILLS.md](./SKILLS.md) for full architectural guidelines.

## 🛑 Strict Agent Directives
1. **Never run `eas build` automatically**: Do NOT execute any cloud build or deployment command on your own.
2. **Local Testing First**: Guide the user to test changes locally via `npx expo start` or `npm run android`.
3. **Always Verify Type Safety**: Run `npx tsc --noEmit` and ensure 0 errors before concluding any task.

## 🏛️ Architectural Commandments
1. **Direct V8 PDF Injection**: Inject large Base64 PDF data directly into `window.__PDF_BASE64_DATA__` via `injectedJavaScriptBeforeContentLoaded` to bypass Android WebView's 1MB IPC limit.
2. **0ms Dynamic Settings**: Apply reader settings in real-time via `webViewRef.current.injectJavaScript()` rather than triggering WebView reloads.
3. **Native Biometrics**: Use `expo-local-authentication` for app lock. Never implement custom PIN inputs or custom auth stores.
4. **Offline First**: All user data, books, and logs stay strictly on the local device (`AsyncStorage` & `FileSystem.documentDirectory`).
