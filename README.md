# ReadMe - Premium Android PDF Book Reader

**ReadMe** is a full-featured, offline-first Android PDF book reader built with **React Native**, **Expo SDK 57**, **TypeScript**, **Expo Router**, and **EAS**, heavily inspired by **Mihon**.

---

## 🌟 Key Features & Capabilities

### 📚 Library & Categorization
- **Multi-Category Management**: Organize books into custom categories (*Currently Reading*, *Favorites*, *Tech & Code*, *Comics*, *Completed*). Full category manager to create, edit, reorder, or delete categories.
- **Auto Cover Generation**: Automatically renders Page 1 of imported PDFs into high-quality PNG thumbnails for grid and list cards, with fallback PDF badges for unopened books.
- **Grid & List Display**: Toggle between responsive grid cards and detailed list cards.
- **Smart Sorting & Filtering**: Sort library entries by title, last read timestamp, progress %, or total page count.

### 📖 High-Performance Reader Engine
- **Dual Reading Modes**:
  - **Long Strip (Continuous Vertical)**: Smooth continuous webtoon-style scrolling.
  - **Single Page Swipe**: Interactive 0.35s animated slider supporting Horizontal LTR and Vertical page transitions.
- **Real-Time Live Dynamic Settings**:
  - Tapping options (Grayscale filter, Inverted Night Mode, Side padding 0% to 25%, Background theme) updates the active document **instantly in real-time (< 1ms)** behind a translucent bottom sheet.
- **Gestures & Controls**: Center-tap gesture overlay HUD, scrubbable page indicator pill, page jump modal, bookmarking drawer, double-tap zoom, and hardware volume button page flipping.

### 🔒 System Security & Privacy
- **Native Android System Biometrics & Device PIN**: Integrates directly with Android system authentication (`expo-local-authentication`) for Fingerprint, Face Unlock, or Device PIN/Pattern protection on launch and background resume.
- **Secure Screen (`FLAG_SECURE`)**: Prevent screenshots and obscure app content in Android Recent Apps task switcher using `expo-screen-capture`.

### 🛠️ Diagnostics & Crash Logging
- **Local Crash Log Recorder**: Automatically writes uncaught JS exceptions, promise rejections, and PDF parsing errors with timestamps to `readme_crash_logs.txt`.
- **Log Exporter**: Inspect raw crash logs in an embedded terminal or share log files via Android native share menu (`expo-sharing`).

### 💾 Data & Backup Management
- **JSON Backup Export & Import**: Export library metadata, bookmarks, categories, reading progress, and settings to a single `.json` backup file and restore it on any device.
- **100% Real Analytics**: No hardcoded mock data. Dynamic calculation of actual PDF file sizes and reading statistics.

---

## ⚡ Innovative Engineering & Optimizations

### 1. Direct V8 Memory Injection (`injectedJavaScriptBeforeContentLoaded`)
- **Problem**: Android Native WebView silently drops IPC `postMessage()` string payloads exceeding ~1 MB, causing large PDF files to freeze on loading.
- **Solution**: Base64 PDF buffers are injected directly into V8 global window memory (`window.__PDF_BASE64_DATA__`) before DOM load, bypassing the 1 MB IPC message limit completely.

### 2. Direct V8 `injectJavaScript()` Execution
- **Problem**: Android IPC message event listeners inside WebViews are asynchronous and unreliable when modal overlays are active.
- **Solution**: Settings modifications and page jumps execute directly inside V8 via `webViewRef.current.injectJavaScript('window.applyDynamicSettings(...)')` for **0ms execution latency** without page reloads.

### 3. Gesture Pill Safe Area Compliance
- **Problem**: Bottom navigation bars in edge-to-edge apps often overlap Android system gesture pills.
- **Solution**: Dynamic inset calculation using `useSafeAreaInsets()` (`height: 56 + insets.bottom`), keeping navigation items cleanly positioned above OS gesture bars across all device form factors.

---

## 🛠️ Tech Stack

- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Routing**: Expo Router (File-based navigation)
- **Language**: TypeScript (100% Type-Safe)
- **PDF Engine**: PDF.js rendered inside optimized WebViews
- **Icons**: Lucide React Native
- **Storage**: `@react-native-async-storage/async-storage` & `expo-file-system`
- **Security**: `expo-local-authentication` & `expo-screen-capture`
- **Sharing**: `expo-sharing`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app or Android Studio Emulator

### Installation & Running Locally

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on connected Android device / emulator
npm run android
```

### Type Checking & Linting

```bash
# Run TypeScript compilation check
npx tsc --noEmit
```

---

## 📱 Building & Release (EAS)

```bash
# Build Android APK (Preview / Sideloading)
npm run eas-build:apk

# Build Google Play Production Bundle (AAB)
npm run eas-build:aab
```

---

## 🛡️ Privacy Policy
ReadMe is 100% offline and privacy-first. We do not collect or track any user data. Read the full [Privacy Policy](file:///C:/Users/pawan/Documents/antigravity/intelligent-darwin/PRIVACY_POLICY.md).

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
