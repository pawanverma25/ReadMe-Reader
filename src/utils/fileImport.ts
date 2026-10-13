import { Book } from '../types';
import { getStoredBooks, saveBookFilePermanently } from './storage';

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
export function normalizeExternalPdfUri(rawUri: string): { realUri: string; isPdfCandidate: boolean } {
  if (!rawUri || typeof rawUri !== 'string') {
    return { realUri: '', isPdfCandidate: false };
  }

  const trimmed = rawUri.trim();
  const lower = trimmed.toLowerCase();

  const isPdfCandidate =
    lower.includes('.pdf') ||
    lower.includes('.provider') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('readme://');

  if (!isPdfCandidate) {
    return { realUri: trimmed, isPdfCandidate: false };
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

  return { realUri, isPdfCandidate: true };
}

/**
 * Securely ingests an incoming PDF file intent without triggering infinite loops,
 * duplicate library entries, or file corruptions.
 */
export async function handleExternalPdfUri(
  rawUri: string | null | undefined,
  options: IngestOptions
): Promise<string | null> {
  if (!rawUri) return null;

  const { realUri, isPdfCandidate } = normalizeExternalPdfUri(rawUri);
  if (!isPdfCandidate) return null;

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

    // 2. Extract clean file name and title
    let fileName = '';
    try {
      const decoded = decodeURIComponent(decodeURIComponent(rawUri));
      const parts = decoded.split('/');
      const last = parts[parts.length - 1];
      if (last && !last.startsWith('document%3A') && !last.startsWith('document:') && !last.startsWith('msf%3A')) {
        fileName = last.endsWith('.pdf') ? last : `${last}.pdf`;
      }
    } catch (_) {}

    if (!fileName) {
      fileName = `Document_${Date.now().toString().slice(-4)}.pdf`;
    }

    let title = fileName.replace(/\.pdf$/i, '').replace(/[_+]/g, ' ').trim() || 'External Document';

    // If a different book with the exact same title already exists, append a unique counter
    const titleCollision = currentBooks.filter(
      (b) => b.title.toLowerCase().startsWith(title.toLowerCase())
    );
    if (titleCollision.length > 0) {
      title = `${title} (${titleCollision.length + 1})`;
    }

    console.log('[FileImport] Copying external file to permanent storage:', fileName);
    const permanentUri = await saveBookFilePermanently(realUri, fileName);

    const newBook = await options.addBook({
      title,
      author: 'Local Document',
      uri: permanentUri,
      originalUri: rawUri,
      fileSize: 2000000,
      totalPages: 1,
      categoryIds: ['cat-all'],
    });

    console.log('[FileImport] Book successfully registered in library! ID:', newBook.id);
    options.router.replace(`/reader/${newBook.id}`);
    return newBook.id;
  } catch (err) {
    console.error('[FileImport] Failed to ingest external PDF:', err);
    return null;
  } finally {
    isImportingLock = false;
  }
}
