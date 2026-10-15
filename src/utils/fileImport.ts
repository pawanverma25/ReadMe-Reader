import { Book } from '../types';
import { getStoredBooks, saveBookFilePermanently } from './storage';
import { formatRegistry } from '../formats';

// Module-level deduplication set and processing lock
const processedUris = new Set<string>();
let isImportingLock = false;

interface IngestOptions {
  books: Book[];
  addBook: (
    bookData: Omit<
      Book,
      'id' | 'addedAt' | 'lastReadAt' | 'bookmarks' | 'currentPage' | 'readingTimeMinutes' | 'readingTimeSeconds' | 'status'
    >
  ) => Promise<Book>;
  router: {
    push: (url: any) => void;
    replace: (url: any) => void;
  };
}

/**
 * Normalizes an incoming raw URI (which may be a readme:// custom scheme from Android intent,
 * a content:// provider URI, or an encoded file:/// URI) into a usable source URI.
 */
export function normalizeExternalFileUri(rawUri: string): { realUri: string; isSupportedCandidate: boolean } {
  if (!rawUri || typeof rawUri !== 'string') {
    return { realUri: '', isSupportedCandidate: false };
  }

  const trimmed = rawUri.trim();
  const lower = trimmed.toLowerCase();

  const isCandidate =
    formatRegistry.isSupportedFile(lower) ||
    lower.includes('.provider') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('readme://');

  if (!isCandidate) {
    return { realUri: trimmed, isSupportedCandidate: false };
  }

  let realUri = trimmed;

  // Convert readme:// back to content:// provider format
  if (realUri.startsWith('readme://')) {
    realUri = realUri.replace(/^readme:\/\//, 'content://');
  }

  // Handle embedded file:/// within double-encoded provider parameters
  if (realUri.includes('file%253A') || realUri.includes('file%3A')) {
    try {
      const decoded = decodeURIComponent(decodeURIComponent(realUri));
      const match = decoded.match(/file:\/\/\/[^\s&]+/);
      if (match && match[0]) {
        realUri = match[0];
      }
    } catch (_) {}
  }

  return { realUri, isSupportedCandidate: true };
}

// Backward-compatible alias
export function normalizeExternalPdfUri(rawUri: string) {
  const res = normalizeExternalFileUri(rawUri);
  return { realUri: res.realUri, isPdfCandidate: res.isSupportedCandidate };
}

/**
 * Securely ingests an incoming document/book file intent without triggering infinite loops,
 * duplicate library entries, or file corruptions.
 */
export async function handleExternalFileUri(
  rawUri: string | null | undefined,
  options: IngestOptions
): Promise<string | null> {
  if (!rawUri) return null;

  const { realUri, isSupportedCandidate } = normalizeExternalFileUri(rawUri);
  if (!isSupportedCandidate) return null;

  // Prevent concurrent ingestion or duplicate handling of the same URI
  if (processedUris.has(rawUri) || processedUris.has(realUri) || isImportingLock) {
    console.log('[FileImport] URI already processed or import lock active. Skipping:', rawUri);
    return null;
  }

  isImportingLock = true;
  processedUris.add(rawUri);
  processedUris.add(realUri);

  try {
    // 1. Fetch current stored books to avoid stale in-memory state
    const currentBooks = options.books.length > 0 ? options.books : await getStoredBooks();

    // Check if book with this URI is already present in library
    const existing = currentBooks.find(
      (b) =>
        b.uri === realUri ||
        b.uri === rawUri ||
        b.originalUri === rawUri ||
        b.originalUri === realUri
    );

    if (existing) {
      console.log('[FileImport] Found existing library book for URI:', existing.id);
      options.router.replace(`/reader/${existing.id}`);
      return existing.id;
    }

    // 2. Extract clean file name and detect format
    let fileName = '';
    try {
      const decoded = decodeURIComponent(decodeURIComponent(rawUri));
      const parts = decoded.split('/');
      const last = parts[parts.length - 1];
      if (last && !last.startsWith('document%3A') && !last.startsWith('document:') && !last.startsWith('msf%3A')) {
        fileName = last;
      }
    } catch (_) {}

    const detectedFormat = formatRegistry.detectFormat(fileName || rawUri);
    const primaryExt = detectedFormat.extensions[0] || '.pdf';

    if (!fileName) {
      fileName = `Document_${Date.now().toString().slice(-4)}${primaryExt}`;
    } else if (!detectedFormat.extensions.some((ext) => fileName.toLowerCase().endsWith(ext))) {
      fileName = `${fileName}${primaryExt}`;
    }

    let title = formatRegistry.cleanTitle(fileName) || 'External Document';

    // If a different book with the exact same title already exists, append a unique counter
    const titleCollision = currentBooks.filter(
      (b) => b.title.toLowerCase().startsWith(title.toLowerCase())
    );
    if (titleCollision.length > 0) {
      title = `${title} (${titleCollision.length + 1})`;
    }

    console.log(`[FileImport] Ingesting ${detectedFormat.name} (${fileName})`);
    const permanentUri = await saveBookFilePermanently(realUri, fileName);

    const newBook = await options.addBook({
      title,
      author: 'Local Document',
      uri: permanentUri,
      originalUri: rawUri,
      format: detectedFormat.id,
      coverColor: detectedFormat.themeColor,
      fileSize: 2000000,
      totalPages: 1,
      categoryIds: ['cat-all'],
    });

    console.log('[FileImport] Book successfully registered in library! ID:', newBook.id);
    options.router.replace(`/reader/${newBook.id}`);
    return newBook.id;
  } catch (err) {
    console.error('[FileImport] Failed to ingest external document:', err);
    return null;
  } finally {
    isImportingLock = false;
  }
}

// Backward-compatible alias
export const handleExternalPdfUri = handleExternalFileUri;

