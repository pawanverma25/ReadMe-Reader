import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarHidden } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { PdfViewerCanvas } from '../../components/reader/PdfViewerCanvas';
import { ReaderOverlay } from '../../components/reader/ReaderOverlay';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { books, updateBookProgress, toggleBookmark } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();

  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState<number>(book?.currentPage || 1);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [pdfFileUri, setPdfFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Keep screen awake while reading
  if (settings.keepScreenOn) {
    useKeepAwake();
  }

  // Manage Fullscreen Edge-to-Edge Status Bar hiding
  useEffect(() => {
    setStatusBarHidden(!overlayVisible, 'slide');
    return () => {
      setStatusBarHidden(false, 'fade');
    };
  }, [overlayVisible]);

  // Zero-RAM Streaming: Copy content:// or file:// URI to cache directory for direct PDF.js disk streaming
  useEffect(() => {
    let isMounted = true;
    async function preparePdfFile() {
      if (!book || !book.uri) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        if (book.uri.startsWith('content://')) {
          const destUri = `${FileSystem.cacheDirectory}reader_${book.id}.pdf`;
          await FileSystem.copyAsync({
            from: book.uri,
            to: destUri,
          });
          if (isMounted) setPdfFileUri(destUri);
        } else {
          if (isMounted) setPdfFileUri(book.uri);
        }
      } catch (err: any) {
        console.error('Error preparing PDF file stream:', err);
        // Fallback to original URI
        if (isMounted) setPdfFileUri(book.uri);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    preparePdfFile();
    return () => {
      isMounted = false;
    };
  }, [book?.id, book?.uri]);

  if (!book) {
    router.replace('/(tabs)');
    return null;
  }

  const handlePageChange = (page: number, totalPages: number) => {
    setCurrentPage(page);
    updateBookProgress(book.id, page, totalPages, settings.incognitoMode);
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
    updateBookProgress(book.id, page, book.totalPages, settings.incognitoMode);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            Preparing PDF Document...
          </Text>
        </View>
      ) : loadError ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{loadError}</Text>
        </View>
      ) : (
        <PdfViewerCanvas
          book={book}
          pdfFileUri={pdfFileUri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
        />
      )}

      {/* Top Header & Bottom Control Overlay HUD */}
      <ReaderOverlay
        book={book}
        settings={settings}
        currentPage={currentPage}
        totalPages={book.totalPages || 40}
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
