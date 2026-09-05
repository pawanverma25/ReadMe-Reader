import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarHidden } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { PdfViewerCanvas, PdfViewerCanvasRef } from '../../components/reader/PdfViewerCanvas';
import { ReaderOverlay } from '../../components/reader/ReaderOverlay';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { books, updateBookProgress, updateBookCover, toggleBookmark } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();

  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState<number>(book?.currentPage || 1);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canvasRef = useRef<PdfViewerCanvasRef>(null);
  const saveProgressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep screen awake while reading
  if (settings.keepScreenOn) {
    useKeepAwake();
  }

  // Manage Status Bar hiding
  useEffect(() => {
    setStatusBarHidden(!overlayVisible, 'slide');
    return () => {
      setStatusBarHidden(false, 'fade');
    };
  }, [overlayVisible]);

  // Clean up debounced storage write on unmount
  useEffect(() => {
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
    };
  }, []);

  // Debounced progress saver to prevent Android AsyncStorage disk lock contention during rapid scrolling
  const debouncedSaveProgress = (page: number, tPages: number) => {
    if (!book) return;
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }
    saveProgressTimeoutRef.current = setTimeout(() => {
      updateBookProgress(book.id, page, tPages, settings.incognitoMode);
    }, 500);
  };

  // Verify file existence without loading entire file into JVM string memory
  useEffect(() => {
    let isMounted = true;
    async function verifyPdfFile() {
      if (!book || !book.uri) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        const info = await FileSystem.getInfoAsync(book.uri);
        if (!info.exists) {
          if (isMounted) {
            setLoadError('PDF document was moved or deleted from device storage.');
          }
          return;
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[ReaderScreen] Error verifying PDF file:', err);
        if (isMounted) {
          setLoadError(`Unable to open PDF file (${err.message || 'File error'}).`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifyPdfFile();
    return () => {
      isMounted = false;
    };
  }, [book?.id, book?.uri]);

  if (!book) {
    router.replace('/(tabs)');
    return null;
  }

  // Triggered when WebView scrolls or swipes (receiver only: no echo loop)
  const handlePageChange = (page: number, totalPages: number) => {
    setCurrentPage(page);
    debouncedSaveProgress(page, totalPages);
  };

  // Triggered only by user actions in React Native HUD (Next/Prev button, jump dialog, bookmark)
  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
    canvasRef.current?.jumpToPage(page);
    debouncedSaveProgress(page, book.totalPages || totalPages);
  };

  const handleCoverGenerated = (coverUrl: string) => {
    if (!book.coverUrl) {
      updateBookCover(book.id, coverUrl);
    }
  };

  const totalPages = book.totalPages && book.totalPages > 1 ? book.totalPages : 1;

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            Loading PDF Document...
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{loadError}</Text>
        </View>
      ) : (
        <PdfViewerCanvas
          ref={canvasRef}
          book={book}
          fileUri={book.uri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onCoverGenerated={handleCoverGenerated}
          onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
        />
      )}

      {/* Top Header & Bottom Control Overlay HUD with Inset Safe Areas */}
      <ReaderOverlay
        book={book}
        settings={settings}
        currentPage={currentPage}
        totalPages={totalPages}
        visible={overlayVisible}
        onBack={() => router.back()}
        onPageSelect={handlePageSelect}
        onToggleBookmark={() => toggleBookmark(book.id, currentPage)}
        onUpdateSettings={updateSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 14,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
