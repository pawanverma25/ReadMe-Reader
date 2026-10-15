import { FormatDefinition } from './types';

// Pre-registered file formats
const DEFAULT_FORMATS: FormatDefinition[] = [
  {
    id: 'pdf',
    name: 'PDF Document',
    badge: 'PDF',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    themeColor: '#E53935',
    isReaderAvailable: true,
  },
  {
    id: 'txt',
    name: 'Text & Markdown Document',
    badge: 'TXT',
    extensions: ['.txt', '.md', '.text'],
    mimeTypes: ['text/plain', 'text/markdown'],
    themeColor: '#00897B',
    isReaderAvailable: true,
  },
  {
    id: 'epub',
    name: 'EPUB EBook',
    badge: 'EPUB',
    extensions: ['.epub'],
    mimeTypes: ['application/epub+zip'],
    themeColor: '#7C4DFF',
    isReaderAvailable: false,
  },
  {
    id: 'cbz',
    name: 'Comic Archive',
    badge: 'CBZ',
    extensions: ['.cbz', '.cbr'],
    mimeTypes: [
      'application/x-cbz',
      'application/vnd.comicbook+zip',
      'application/x-cbr',
      'application/vnd.comicbook-rar',
    ],
    themeColor: '#FB8C00',
    isReaderAvailable: false,
  },
];

class FormatRegistry {
  private formats: Map<string, FormatDefinition> = new Map();

  constructor() {
    for (const fmt of DEFAULT_FORMATS) {
      this.registerFormat(fmt);
    }
  }

  /**
   * Registers a new file format. Allows third-party or custom format extensions.
   */
  public registerFormat(format: FormatDefinition): void {
    this.formats.set(format.id.toLowerCase(), format);
  }

  /**
   * Returns all currently registered formats.
   */
  public getAllFormats(): FormatDefinition[] {
    return Array.from(this.formats.values());
  }

  /**
   * Finds a format by its unique ID (e.g. 'pdf', 'epub').
   */
  public getFormatById(id?: string): FormatDefinition | undefined {
    if (!id) return undefined;
    return this.formats.get(id.toLowerCase());
  }

  /**
   * Detects the format of a file based on its URI/filename and optional MIME type.
   * Defaults to 'pdf' if unknown to maintain backward compatibility.
   */
  public detectFormat(uriOrFilename: string, mimeType?: string): FormatDefinition {
    const cleanStr = (uriOrFilename || '').toLowerCase();
    const cleanMime = (mimeType || '').toLowerCase();

    // 1. Direct MIME type match
    if (cleanMime) {
      for (const fmt of this.formats.values()) {
        if (fmt.mimeTypes.some((m) => m.toLowerCase() === cleanMime)) {
          return fmt;
        }
      }
    }

    // 2. Extension match
    for (const fmt of this.formats.values()) {
      for (const ext of fmt.extensions) {
        if (cleanStr.endsWith(ext) || cleanStr.includes(`${ext}?`)) {
          return fmt;
        }
      }
    }

    // Fallback: Check if string contains any extension indicator
    for (const fmt of this.formats.values()) {
      if (fmt.extensions.some((ext) => cleanStr.includes(ext))) {
        return fmt;
      }
    }

    // Default fallback format is PDF
    return this.formats.get('pdf') || DEFAULT_FORMATS[0];
  }

  /**
   * Returns an array of all supported extensions across all registered formats (e.g. ['.pdf', '.epub', ...])
   */
  public getSupportedExtensions(): string[] {
    const exts = new Set<string>();
    for (const fmt of this.formats.values()) {
      for (const ext of fmt.extensions) {
        exts.add(ext);
      }
    }
    return Array.from(exts);
  }

  /**
   * Returns an array of all MIME types supported by the picker and intent receivers.
   */
  public getSupportedMimeTypes(): string[] {
    const mimes = new Set<string>();
    for (const fmt of this.formats.values()) {
      for (const m of fmt.mimeTypes) {
        mimes.add(m);
      }
    }
    return Array.from(mimes);
  }

  /**
   * Checks whether a URI or filename corresponds to any registered format.
   */
  public isSupportedFile(uriOrFilename: string, mimeType?: string): boolean {
    const cleanStr = (uriOrFilename || '').toLowerCase();
    const cleanMime = (mimeType || '').toLowerCase();

    if (cleanMime && this.getSupportedMimeTypes().some((m) => m.toLowerCase() === cleanMime)) {
      return true;
    }

    return this.getSupportedExtensions().some((ext) => cleanStr.includes(ext));
  }

  /**
   * Strips file extensions from a filename to produce a clean book title.
   */
  public cleanTitle(fileName: string): string {
    let title = fileName;
    for (const ext of this.getSupportedExtensions()) {
      const regex = new RegExp(`\\${ext}$`, 'i');
      title = title.replace(regex, '');
    }
    return title.replace(/[_+]/g, ' ').trim() || 'Untitled Book';
  }
}

export const formatRegistry = new FormatRegistry();
