# ReadMe Development Skills & Collaboration Guide

This document outlines the core architectural patterns, engineering conventions, security rules, and development workflows for contributors and AI coding agents working on **ReadMe**.

---

## 🏛️ Project Architecture Overview

ReadMe is an offline-first, privacy-focused PDF & Comic Book Reader for Android built with **Expo SDK 57**, **React Native 0.86**, **React 19**, and **Expo Router**.

### 📂 Directory Structure

```
├── src/
│   ├── app/                      # Expo Router file-based navigation
│   │   ├── (tabs)/               # Bottom tab screens (library, explore, settings)
│   │   ├── reader/               # Active PDF reading screens
│   │   │   ├── [id].tsx          # Reader entrypoint
│   │   │   └── webtoon.tsx       # Continuous vertical long-strip reader
│   │   ├── settings/             # Settings sub-routes (appearance, security, advanced, etc.)
│   │   ├── modal/                # Modal dialogs (category editor, jump to page)
│   │   └── _layout.tsx           # Root provider stack (Security, Theme, Library)
│   ├── components/               # Modular UI components
│   │   ├── reader/               # Reader controls, HUD overlay, dynamic settings sheet
│   │   ├── library/              # Book cards, category chips, view toggles
│   │   └── ui/                   # Reusable buttons, switches, bottom sheets
│   ├── contexts/                 # Global React contexts
│   │   ├── LibraryContext.tsx    # Books, categories, reading progress state
│   │   ├── ThemeContext.tsx      # Palette tokens (AMOLED, Catppuccin, Nord, etc.)
│   │   └── SecurityContext.tsx   # Biometric app lock & FLAG_SECURE management
│   └── utils/                    # Utility modules
│       ├── logger.ts             # File-based crash diagnostics recorder
│       ├── pdfStorage.ts         # SAF & sandboxed document storage helpers
│       └── backup.ts             # JSON backup import/export
├── assets/
│   └── images/                   # App icons, adaptive layers, Play Store assets
├── docs/                         # GitHub Pages privacy policy & web documentation
├── app.json                      # Expo application manifest
└── eas.json                      # Cloud build & release profiles
```

---

## ⚡ Core Engineering Conventions

### 1. Direct V8 Memory Injection for PDF Buffers
- **The Issue**: Android Native WebView silently drops IPC `postMessage()` string payloads exceeding ~1 MB, causing large PDFs to hang or freeze.
- **The Rule**: Always inject Base64 PDF data directly into V8 global window memory (`window.__PDF_BASE64_DATA__`) using `injectedJavaScriptBeforeContentLoaded`.
- **Never** pass large PDF Base64 strings across postMessage queues.

### 2. Zero-Latency Dynamic Settings Injection
- **The Rule**: When the user adjusts reader settings (theme, invert colors, side margins, zoom), inject code directly via `webViewRef.current.injectJavaScript('window.applyDynamicSettings(...)')`.
- This ensures **< 1ms response latency** without remounting or reloading the WebView.

### 3. Android Gesture Pill Safe Area Compliance
- Edge-to-edge screens must calculate bottom padding dynamically using `useSafeAreaInsets()`:
  ```typescript
  const insets = useSafeAreaInsets();
  const bottomBarHeight = 56 + insets.bottom;
  ```
- Never use fixed bottom pixel offsets for navigation toolbars.

### 4. Native Hardware Security
- **App Lock**: Use `expo-local-authentication` (`LocalAuthentication.authenticateAsync`). Never build custom PIN screens or store plain-text passwords.
- **Secure Screen**: Use `expo-screen-capture` (`preventScreenCaptureAsync`) to enforce Android `FLAG_SECURE`.

### 5. Offline-First Data Storage
- Store metadata (books, categories, bookmarks, timestamps) in `@react-native-async-storage/async-storage`.
- Store document files exclusively in `FileSystem.documentDirectory`.
- No network requests or telemetry SDKs allowed.

---

## 🎨 Design System & UI Rules

- **Theme Palette**: Dark-mode first (`#0E0D14` canvas, `#161420` card surfaces, `#E11D48` crimson magenta accent).
- **Icons**: Exclusively use `lucide-react-native`. Do not import unoptimized PNG icons for buttons.
- **Typography & Layout**: Clean typography with consistent line heights and fluid responsive cards.

---

## 🛠️ Development & Build Directives

### Local Development
```bash
# Start Metro bundler
npm start

# Run on connected Android device/emulator
npm run android

# Verify TypeScript compilation (MUST be 0 errors)
npx tsc --noEmit
```

### 🚨 Critical EAS Build Rule for AI Agents & Contributors
- **NEVER trigger `eas build` or cloud builds automatically.**
- All code changes must be validated locally via `npx tsc --noEmit` and local testing before requesting user deployment.
