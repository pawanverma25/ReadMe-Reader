# Privacy Policy for ReadMe - PDF Book Reader

**Last Updated:** August 16, 2026

**ReadMe** is developed as a privacy-first, 100% offline, local-first application. We believe your reading habits, library contents, and documents are strictly personal and should remain private.

---

> [!NOTE]
> **Summary:** ReadMe does not collect, transmit, store on external servers, or sell any personal information, documents, reading history, or analytics data. Everything stays on your local device.

---

## 1. Information Collection and Use

ReadMe does **not** collect or transmit any personally identifiable information (PII):

- **No Account Required:** You do not need to register, sign in, or provide an email address, phone number, or any other personal details.
- **No Analytics or Trackers:** The application contains zero third-party tracking SDKs, behavioral analytics, or telemetry frameworks.
- **No Cloud Synchronization:** Your reading progress, bookmarks, custom categories, and library statistics are stored exclusively in your device's local database and private sandbox.

---

## 2. Document Access and Storage

When you import or open PDF files in ReadMe:
- Files are opened using Android's native **Storage Access Framework (SAF)**.
- Imported documents are copied strictly to the application's sandboxed internal storage (`FileSystem.documentDirectory`).
- Documents are processed and rendered on-device using local rendering engines. We never upload, index, scan, or transmit your files to any remote server or third-party service.

---

## 3. Device Permissions

ReadMe requests only minimal permissions required to deliver its core features:

| Permission | Purpose |
| :--- | :--- |
| **Biometric / Device Authentication** | Used exclusively via Android's `BiometricPrompt` API to lock/unlock the app when App Lock is enabled. Biometric data is processed entirely by your device's hardware security module (Keystore) and is never accessible to the app. |
| **Storage / Document Picker** | Used solely to allow you to select PDF files from your device storage. |
| **Screen Security (`FLAG_SECURE`)** | Used to block screen capture and task-switcher previews when Secure Screen is enabled by the user. |

---

## 4. Crash Diagnostics & Local Logs

ReadMe includes an optional diagnostic log recorder to assist in troubleshooting PDF parsing or reader crashes:
- Logs contain only technical diagnostic information (e.g., error stack traces and timestamps).
- Logs are saved locally in the app's cache directory.
- Logs are **never** transmitted automatically. You have full control to manually share or export log files using the standard Android system share sheet.

---

## 5. Third-Party Services & Advertising

ReadMe contains **no advertising SDKs** (such as Google AdMob or Unity Ads) and does not share any data with advertising brokers, data aggregators, or external services.

---

## 6. Children's Privacy

ReadMe does not collect any personal information from anyone, including children under the age of 13.

---

## 7. Changes to This Privacy Policy

We may update this Privacy Policy periodically. Any changes will be posted directly to this repository with an updated revision date.

---

## 8. Contact & Open Source

If you have questions or suggestions regarding this Privacy Policy, please open an issue on our GitHub repository:
- **Repository:** [https://github.com/pawanverma25/ReadMe-Reader](https://github.com/pawanverma25/ReadMe-Reader)
- **Developer:** Pawan Verma
