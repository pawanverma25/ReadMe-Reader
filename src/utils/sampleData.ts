import { Book, Category, ReaderSettings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All', order: 0, isDefault: true, icon: 'book-open' },
  { id: 'cat-reading', name: 'Currently Reading', order: 1, isDefault: true, icon: 'clock' },
  { id: 'cat-favorites', name: 'Favorites', order: 2, isDefault: false, icon: 'heart' },
  { id: 'cat-tech', name: 'Tech & Code', order: 3, isDefault: false, icon: 'code' },
  { id: 'cat-comics', name: 'Manga & Comics', order: 4, isDefault: false, icon: 'sparkles' },
  { id: 'cat-completed', name: 'Completed', order: 5, isDefault: false, icon: 'check-circle' },
];

export const INITIAL_SETTINGS: ReaderSettings = {
  readingMode: 'long_strip',
  readerTheme: 'oled',
  cropBorders: false,
  splitWidePages: false,
  rotateWidePages: false,
  doubleTapToZoom: true,
  disableZoomOut: false,
  sidePadding: 0,
  keepScreenOn: true,
  volumeKeyNavigation: false,
  showActionsOnLongTap: true,
  invertTapZones: false,
  incognitoMode: false,
  grayscale: false,
  inverted: false,
};

// Clean default state without dummy books
export const SAMPLE_BOOKS: Book[] = [];
