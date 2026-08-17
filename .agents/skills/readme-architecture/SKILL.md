---
name: readme-architecture
description: Architecture, PDF rendering patterns, security protocols, and development rules for the ReadMe PDF reader application.
---

# ReadMe Architecture & Development Skill

## Purpose
Use this skill when developing, refactoring, or adding features to the **ReadMe** Android PDF reader.

## Key Rules & Patterns

### 1. PDF Loading & V8 Memory Injection
- Always load PDF data in WebViews by injecting the Base64 string directly into `window.__PDF_BASE64_DATA__` via `injectedJavaScriptBeforeContentLoaded`.
- Avoid sending large Base64 files through `postMessage` (Android WebView limits IPC to ~1MB).

### 2. Live Dynamic Settings
- When changing reader themes, margins, color inversion, or zoom, inject execution directly into the active WebView via:
  ```typescript
  webViewRef.current?.injectJavaScript(`window.applyDynamicSettings(${JSON.stringify(newSettings)}); true;`);
  ```

### 3. Biometric Security & Screen Privacy
- App Lock must use `LocalAuthentication.authenticateAsync` from `expo-local-authentication`.
- Secure Screen must use `preventScreenCaptureAsync()` / `allowScreenCaptureAsync()` from `expo-screen-capture`.

### 4. Edge-to-Edge Safe Area Insets
- Dynamic calculation for bottom bars and gesture pills:
  ```typescript
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  const insets = useSafeAreaInsets();
  const bottomHeight = 56 + insets.bottom;
  ```

### 5. Verification
- Always execute `npx tsc --noEmit` to ensure zero compilation errors.
- Never run `eas build` on your own without explicit user approval.
