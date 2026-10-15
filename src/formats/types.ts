import React from 'react';
import { Book, ReaderSettings } from '../types';

export type FileFormatId = 'pdf' | 'epub' | 'txt' | 'cbz' | string;

export interface ExtractedMetadata {
  title?: string;
  author?: string;
  totalPages?: number;
  description?: string;
  coverColor?: string;
  coverUrl?: string;
}

export interface ReaderEngineProps {
  book: Book;
  fileUri: string;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, total?: number) => void;
  onCoverGenerated?: (coverDataUrl: string) => void;
  onToggleOverlay: () => void;
}

export interface FormatDefinition {
  /** Unique format identifier, e.g. 'pdf', 'epub', 'txt', 'cbz' */
  id: FileFormatId;
  /** Human-readable name, e.g. 'PDF Document', 'EPUB EBook' */
  name: string;
  /** Short uppercase badge, e.g. 'PDF', 'EPUB', 'TXT', 'CBZ' */
  badge: string;
  /** Supported file extensions with leading dot, e.g. ['.pdf'] */
  extensions: string[];
  /** Supported MIME types */
  mimeTypes: string[];
  /** Primary accent color used for fallback covers and badges */
  themeColor: string;
  /** Whether a dedicated reading engine component is currently active for this format */
  isReaderAvailable: boolean;
  /** Optional custom metadata extractor */
  extractMetadata?: (uri: string, originalName?: string) => Promise<ExtractedMetadata>;
  /** Optional custom thumbnail generator */
  generateThumbnail?: (uri: string, bookId: string) => Promise<string | null>;
  /** Optional custom Reader Engine component */
  readerComponent?: React.ComponentType<ReaderEngineProps>;
}
