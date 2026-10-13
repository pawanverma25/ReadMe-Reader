import React, { createContext, useContext, useEffect, useState } from 'react';
import { Book, Bookmark, Category, StatusType } from '../types';
import {
  autoMigrateCachedBooks,
  deleteBookFile,
  getStoredBooks,
  getStoredCategories,
  saveStoredBooks,
  saveStoredCategories,
} from '../utils/storage';

export type SortOption = 'title' | 'lastRead' | 'progress' | 'dateAdded';
export type ViewMode = 'grid' | 'compact' | 'list';

interface LibraryContextType {
  books: Book[];
  categories: Category[];
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'lastReadAt' | 'bookmarks' | 'currentPage' | 'readingTimeMinutes' | 'readingTimeSeconds' | 'status'>) => Promise<Book>;
  updateBookProgress: (
    bookId: string,
    page: number,
    totalPages?: number,
    isIncognito?: boolean
  ) => Promise<void>;
  recordReadingTime: (bookId: string, seconds: number, isIncognito?: boolean) => Promise<void>;
  updateBookCover: (bookId: string, coverUrl: string) => Promise<void>;
  updateBookUri: (bookId: string, newUri: string, newFileSize?: number) => Promise<void>;
  toggleBookmark: (bookId: string, page: number, title?: string) => Promise<void>;
  updateBookmarkNote: (bookId: string, bookmarkId: string, note: string) => Promise<void>;
  deleteBookmark: (bookId: string, bookmarkId: string) => Promise<void>;
  updateBookStatus: (bookId: string, status: StatusType) => Promise<void>;
  updateBookCategories: (bookId: string, categoryIds: string[]) => Promise<void>;
  toggleFavorite: (bookId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  createCategory: (name: string, icon?: string) => Promise<Category>;
  editCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reloadAllData: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('lastRead');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const loadData = async () => {
    const loadedBooks = await getStoredBooks();
    const loadedCategories = await getStoredCategories();

    // Auto-migrate any previously cached books to permanent storage
    const { books: migratedBooks } = await autoMigrateCachedBooks(loadedBooks);

    setBooks(migratedBooks);
    setCategories(loadedCategories);
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadAllData = async () => {
    await loadData();
  };

  const addBook = async (
    bookData: Omit<Book, 'id' | 'addedAt' | 'lastReadAt' | 'bookmarks' | 'currentPage' | 'readingTimeMinutes' | 'readingTimeSeconds' | 'status'>
  ): Promise<Book> => {
    // 1. Fetch fresh books directly from disk to prevent stale closures from overwriting the library
    const existingBooks = await getStoredBooks();

    // Check if book with matching URI already exists in persistent storage
    const duplicate = existingBooks.find(
      (b) => b.uri === bookData.uri || (b.originalUri && bookData.originalUri && b.originalUri === bookData.originalUri)
    );
    if (duplicate) {
      console.log('[LibraryContext] Book already exists in storage, returning existing:', duplicate.id);
      return duplicate;
    }

    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      addedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      currentPage: 1,
      status: 'unread',
      bookmarks: [],
      readingTimeMinutes: 0,
      readingTimeSeconds: 0,
      categoryIds: bookData.categoryIds && bookData.categoryIds.length > 0 ? bookData.categoryIds : ['cat-all'],
    };

    const updated = [newBook, ...existingBooks];
    setBooks(updated);
    await saveStoredBooks(updated);
    return newBook;
  };

  const updateBookProgress = async (
    bookId: string,
    page: number,
    totalPages?: number,
    isIncognito?: boolean
  ) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        const tPages = totalPages || b.totalPages || 1;
        const targetPage = Math.max(1, Math.min(page, tPages));
        const isCompleted = targetPage >= tPages;
        const status: StatusType = isCompleted ? 'completed' : targetPage > 1 ? 'reading' : b.status;

        return {
          ...b,
          currentPage: targetPage,
          totalPages: tPages,
          status,
          lastReadAt: isIncognito ? b.lastReadAt : new Date().toISOString(),
        };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const recordReadingTime = async (bookId: string, seconds: number, isIncognito?: boolean) => {
    if (isIncognito || seconds <= 0) return;
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        const prevSec = b.readingTimeSeconds ?? ((b.readingTimeMinutes || 0) * 60);
        const newSec = prevSec + seconds;
        const newMins = Math.floor(newSec / 60);
        return {
          ...b,
          readingTimeSeconds: newSec,
          readingTimeMinutes: newMins,
          lastReadAt: new Date().toISOString(),
        };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const updateBookCover = async (bookId: string, coverUrl: string) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === bookId ? { ...b, coverUrl } : b));
      saveStoredBooks(updated);
      return updated;
    });
  };

  const updateBookUri = async (bookId: string, newUri: string, newFileSize?: number) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        return {
          ...b,
          uri: newUri,
          fileSize: newFileSize ?? b.fileSize,
        };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const toggleBookmark = async (bookId: string, page: number, title?: string) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        const existingIdx = b.bookmarks.findIndex((bm) => bm.page === page);
        let newBookmarks: Bookmark[];

        if (existingIdx >= 0) {
          newBookmarks = b.bookmarks.filter((_, idx) => idx !== existingIdx);
        } else {
          const newBm: Bookmark = {
            id: `bm-${Date.now()}`,
            page,
            title: title || `Page ${page}`,
            createdAt: new Date().toISOString(),
          };
          newBookmarks = [...b.bookmarks, newBm].sort((a, b) => a.page - b.page);
        }

        return { ...b, bookmarks: newBookmarks };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const updateBookmarkNote = async (bookId: string, bookmarkId: string, note: string) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        const newBookmarks = b.bookmarks.map((bm) =>
          bm.id === bookmarkId ? { ...bm, note } : bm
        );
        return { ...b, bookmarks: newBookmarks };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const deleteBookmark = async (bookId: string, bookmarkId: string) => {
    setBooks((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== bookId) return b;
        return { ...b, bookmarks: b.bookmarks.filter((bm) => bm.id !== bookmarkId) };
      });
      saveStoredBooks(updated);
      return updated;
    });
  };

  const updateBookStatus = async (bookId: string, status: StatusType) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === bookId ? { ...b, status } : b));
      saveStoredBooks(updated);
      return updated;
    });
  };

  const updateBookCategories = async (bookId: string, categoryIds: string[]) => {
    setBooks((prev) => {
      const updated = prev.map((b) =>
        b.id === bookId
          ? { ...b, categoryIds: categoryIds.length > 0 ? categoryIds : ['cat-all'] }
          : b
      );
      saveStoredBooks(updated);
      return updated;
    });
  };

  const toggleFavorite = async (bookId: string) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === bookId ? { ...b, isFavorite: !b.isFavorite } : b));
      saveStoredBooks(updated);
      return updated;
    });
  };

  const deleteBook = async (bookId: string) => {
    setBooks((prev) => {
      const bookToDelete = prev.find((b) => b.id === bookId);
      if (bookToDelete) {
        deleteBookFile(bookToDelete.uri, bookToDelete.coverUrl);
      }
      const updated = prev.filter((b) => b.id !== bookId);
      saveStoredBooks(updated);
      return updated;
    });
  };

  const createCategory = async (name: string, icon = 'folder'): Promise<Category> => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      order: categories.length,
      isDefault: false,
      icon,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveStoredCategories(updated);
    return newCat;
  };

  const editCategory = async (id: string, name: string) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c));
    setCategories(updated);
    await saveStoredCategories(updated);
  };

  const deleteCategory = async (id: string) => {
    const updatedCats = categories.filter((c) => c.id !== id);
    setCategories(updatedCats);
    await saveStoredCategories(updatedCats);

    // Remove deleted category from books
    const updatedBooks = books.map((b) => ({
      ...b,
      categoryIds: b.categoryIds.filter((catId) => catId !== id),
    }));
    setBooks(updatedBooks);
    await saveStoredBooks(updatedBooks);
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        categories,
        activeCategoryId,
        setActiveCategoryId,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        viewMode,
        setViewMode,
        addBook,
        updateBookProgress,
        recordReadingTime,
        updateBookCover,
        updateBookUri,
        toggleBookmark,
        updateBookmarkNote,
        deleteBookmark,
        updateBookStatus,
        updateBookCategories,
        toggleFavorite,
        deleteBook,
        createCategory,
        editCategory,
        deleteCategory,
        reloadAllData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
