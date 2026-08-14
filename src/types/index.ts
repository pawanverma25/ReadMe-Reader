export type StatusType = 'unread' | 'reading' | 'completed';

export interface Bookmark {
  id: string;
  page: number;
  title?: string;
  note?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  coverColor?: string;
  description?: string;
  uri: string;
  fileSize?: number;
  totalPages: number;
  currentPage: number;
  categoryIds: string[];
  addedAt: string;
  lastReadAt: string;
  status: StatusType;
  rating?: number;
  bookmarks: Bookmark[];
  readingTimeMinutes: number;
  isSample?: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
  icon?: string;
}

export type ThemePreset = 'default' | 'dynamic' | 'catppuccin' | 'green_apple';
export type ThemeMode = 'system' | 'light' | 'dark';

export type ReadingMode = 'long_strip' | 'single_page_h' | 'single_page_v';
export type ReaderTheme = 'oled' | 'dark' | 'sepia' | 'light';

export interface ReaderSettings {
  readingMode: ReadingMode;
  readerTheme: ReaderTheme;
  cropBorders: boolean;
  splitWidePages: boolean;
  rotateWidePages: boolean;
  doubleTapToZoom: boolean;
  disableZoomOut: boolean;
  sidePadding: number; // 0-25
  keepScreenOn: boolean;
  volumeKeyNavigation: boolean;
  showActionsOnLongTap: boolean;
  invertTapZones: boolean;
}

export interface BackupData {
  version: string;
  appName: string;
  exportedAt: string;
  categories: Category[];
  books: Book[];
  readerSettings: ReaderSettings;
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  pureBlackDarkMode: boolean;
}
