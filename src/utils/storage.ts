import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { BackupData, Book, Category, ReaderSettings, ThemeMode, ThemePreset } from '../types';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS, SAMPLE_BOOKS } from './sampleData';

const KEYS = {
  BOOKS: '@readme_books_v1',
  CATEGORIES: '@readme_categories_v1',
  SETTINGS: '@readme_settings_v1',
  THEME_MODE: '@readme_theme_mode_v1',
  THEME_PRESET: '@readme_theme_preset_v1',
  PURE_BLACK: '@readme_pure_black_v1',
};

// --- Books Operations ---
export const getStoredBooks = async (): Promise<Book[]> => {
  try {
    const jsonStr = await AsyncStorage.getItem(KEYS.BOOKS);
    if (!jsonStr) {
      // First launch: initialize with sample books
      await saveStoredBooks(SAMPLE_BOOKS);
      return SAMPLE_BOOKS;
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to get books:', error);
    return SAMPLE_BOOKS;
  }
};

export const saveStoredBooks = async (books: Book[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  } catch (error) {
    console.error('Failed to save books:', error);
  }
};

// --- Categories Operations ---
export const getStoredCategories = async (): Promise<Category[]> => {
  try {
    const jsonStr = await AsyncStorage.getItem(KEYS.CATEGORIES);
    if (!jsonStr) {
      await saveStoredCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to get categories:', error);
    return INITIAL_CATEGORIES;
  }
};

export const saveStoredCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save categories:', error);
  }
};

// --- Reader Settings Operations ---
export const getStoredSettings = async (): Promise<ReaderSettings> => {
  try {
    const jsonStr = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!jsonStr) {
      await saveStoredSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(jsonStr) };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return INITIAL_SETTINGS;
  }
};

export const saveStoredSettings = async (settings: ReaderSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// --- Theme Operations ---
export const getStoredThemePreferences = async () => {
  try {
    const mode = (await AsyncStorage.getItem(KEYS.THEME_MODE)) as ThemeMode || 'dark';
    const preset = (await AsyncStorage.getItem(KEYS.THEME_PRESET)) as ThemePreset || 'default';
    const pureBlack = (await AsyncStorage.getItem(KEYS.PURE_BLACK)) === 'true';
    return { mode, preset, pureBlack };
  } catch (error) {
    return { mode: 'dark' as ThemeMode, preset: 'default' as ThemePreset, pureBlack: false };
  }
};

export const saveStoredThemePreferences = async (
  mode: ThemeMode,
  preset: ThemePreset,
  pureBlack: boolean
) => {
  try {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
    await AsyncStorage.setItem(KEYS.THEME_PRESET, preset);
    await AsyncStorage.setItem(KEYS.PURE_BLACK, String(pureBlack));
  } catch (error) {
    console.error('Failed to save theme preferences:', error);
  }
};

// --- Backup & Export / Import ---
export const exportBackupToFile = async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const books = await getStoredBooks();
    const categories = await getStoredCategories();
    const readerSettings = await getStoredSettings();
    const themePrefs = await getStoredThemePreferences();

    const backupPayload: BackupData = {
      version: '1.0',
      appName: 'ReadMe',
      exportedAt: new Date().toISOString(),
      categories,
      books,
      readerSettings,
      themeMode: themePrefs.mode,
      themePreset: themePrefs.preset,
      pureBlackDarkMode: themePrefs.pureBlack,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `readme_backup_${dateStr}.json`;
    const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    const filePath = `${docDir}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupPayload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export ReadMe Backup',
        UTI: 'public.json',
      });
    }

    return { success: true, filePath };
  } catch (error: any) {
    console.error('Export failed:', error);
    return { success: false, error: error?.message || 'Failed to export backup file' };
  }
};

export const importBackupFromFile = async (): Promise<{
  success: boolean;
  data?: BackupData;
  error?: string;
}> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'Import cancelled' };
    }

    const pickedFile = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(pickedFile.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsedData: BackupData = JSON.parse(fileContent);

    // Validate payload
    if (!parsedData || !Array.isArray(parsedData.books) || !Array.isArray(parsedData.categories)) {
      return { success: false, error: 'Invalid backup file format. Missing books or categories.' };
    }

    // Save restored data to AsyncStorage
    await saveStoredBooks(parsedData.books);
    await saveStoredCategories(parsedData.categories);
    if (parsedData.readerSettings) await saveStoredSettings(parsedData.readerSettings);
    if (parsedData.themeMode) {
      await saveStoredThemePreferences(
        parsedData.themeMode,
        parsedData.themePreset || 'default',
        parsedData.pureBlackDarkMode ?? false
      );
    }

    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error('Import failed:', error);
    return { success: false, error: error?.message || 'Failed to parse backup JSON file' };
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.BOOKS,
      KEYS.CATEGORIES,
      KEYS.SETTINGS,
      KEYS.THEME_MODE,
      KEYS.THEME_PRESET,
      KEYS.PURE_BLACK,
    ]);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
