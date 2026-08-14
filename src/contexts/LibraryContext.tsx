import React, { createContext, useContext, useEffect, useState } from 'react';
import { Book, Bookmark, Category, StatusType } from '../types';
import {
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
  addBook: (book: Omit<Book, 'id' | 'addedAt' | 'lastReadAt' | 'bookmarks' | 'currentPage' | 'readingTimeMinutes' | 'status'>) => Promise<Book>;
  updateBookProgress: (bookId: string, page: number, totalPages?: number) => Promise<void>;
  toggleBookmark: (bookId: string, page: number, title?: string) => Promise<void>;
  updateBookStatus: (bookId: string, status: StatusType) => Promise<void>;
  updateBookCategories: (bookId: string, categoryIds: string[]) => Promise<void>;
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
    setBooks(loadedBooks);
    setCategories(loadedCategories);
  };

  useEffect(() => {
    loadData();
  }, []);

  const reloadAllData = async () => {
    await loadData();
  };

  const addBook = async (
    bookData: Omit<Book, 'id' | 'addedAt' | 'lastReadAt' | 'bookmarks' | 'currentPage' | 'readingTimeMinutes' | 'status'>
  ): Promise<Book> => {
    const newBook: Book = {
      ...bookData,
      id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      addedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      currentPage: 1,
      status: 'unread',
      bookmarks: [],
      readingTimeMinutes: 0,
      categoryIds: bookData.categoryIds.length > 0 ? bookData.categoryIds : ['cat-all'],
    };

    const updated = [newBook, ...books];
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
    const updated = books.map((b) => {
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
        readingTimeMinutes: isIncognito ? b.readingTimeMinutes : b.readingTimeMinutes + 1,
      };
    });

    setBooks(updated);
    await saveStoredBooks(updated);
  };

  const toggleBookmark = async (bookId: string, page: number, title?: string) => {
    const updated = books.map((b) => {
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

    setBooks(updated);
    await saveStoredBooks(updated);
  };

  const updateBookStatus = async (bookId: string, status: StatusType) => {
    const updated = books.map((b) => (b.id === bookId ? { ...b, status } : b));
    setBooks(updated);
    await saveStoredBooks(updated);
  };

  const updateBookCategories = async (bookId: string, categoryIds: string[]) => {
    const updated = books.map((b) =>
      b.id === bookId
        ? { ...b, categoryIds: categoryIds.length > 0 ? categoryIds : ['cat-all'] }
        : b
    );
    setBooks(updated);
    await saveStoredBooks(updated);
  };

  const deleteBook = async (bookId: string) => {
    const updated = books.filter((b) => b.id !== bookId);
    setBooks(updated);
    await saveStoredBooks(updated);
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
        toggleBookmark,
        updateBookStatus,
        updateBookCategories,
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
