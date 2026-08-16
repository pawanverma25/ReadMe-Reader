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
  const { books, updateBookProgress, updateBookCover, toggleBookmark } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();

  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState<number>(book?.currentPage || 1);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // Read local PDF document into Base64 buffer for 100% reliable WebView canvas rendering
  useEffect(() => {
    let isMounted = true;
    async function loadPdfBase64() {
      if (!book || !book.uri) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        console.log('[ReaderScreen] Starting FileSystem.readAsStringAsync for book:', book.title, 'URI:', book.uri);
        const base64Data = await FileSystem.readAsStringAsync(book.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('[ReaderScreen] FileSystem read complete! Base64 length:', base64Data ? base64Data.length : 0);

        if (isMounted) {
          setPdfBase64(base64Data);
        }
      } catch (err: any) {
        console.error('[ReaderScreen] Error reading PDF file into Base64:', err);
        if (isMounted) {
          setLoadError(`Unable to load PDF file (${err.message || 'File error'}).`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPdfBase64();
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
    updateBookProgress(book.id, page, book.totalPages || totalPages, settings.incognitoMode);
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
          book={book}
          pdfBase64={pdfBase64}
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
