import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarHidden } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as DocumentPicker from 'expo-document-picker';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { PdfViewerCanvas, PdfViewerCanvasRef } from '../../components/reader/PdfViewerCanvas';
import { ReaderOverlay } from '../../components/reader/ReaderOverlay';
import { resolveBookUri, saveBookFilePermanently } from '../../utils/storage';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { books, updateBookProgress, updateBookCover, updateBookUri, toggleBookmark } = useLibrary();
  const { settings, updateSettings } = useReaderSettings();

  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState<number>(book?.currentPage || 1);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRelinking, setIsRelinking] = useState<boolean>(false);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);

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

  // Verify file existence and heal path if necessary without loading entire file into JVM string memory
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

        const realUri = await resolveBookUri(book.uri);
        if (!realUri) {
          if (isMounted) {
            setLoadError('PDF document was moved, cleared from cache during an update, or is no longer accessible.');
          }
          return;
        }

        // If path healed/changed (e.g. from /data/user/0 to /data/data or found in documents)
        if (realUri !== book.uri) {
          await updateBookUri(book.id, realUri);
        }

        if (isMounted) {
          setResolvedUri(realUri);
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

  const handleRelinkPdf = async () => {
    if (!book) return;
    try {
      setIsRelinking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsRelinking(false);
        return;
      }

      const pickedAsset = result.assets[0];
      const permanentUri = await saveBookFilePermanently(
        pickedAsset.uri,
        pickedAsset.name || book.title || 'document.pdf'
      );

      await updateBookUri(book.id, permanentUri, pickedAsset.size);
      setResolvedUri(permanentUri);
      setLoadError(null);
    } catch (err: any) {
      console.error('[ReaderScreen] Failed to relink PDF:', err);
      Alert.alert('Relink Failed', 'Could not save the selected PDF file. Please try again.');
    } finally {
      setIsRelinking(false);
    }
  };

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
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.errorIconBg, { backgroundColor: colors.danger + '18' }]}>
              <AlertTriangle size={36} color={colors.danger} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
              PDF File Not Found
            </Text>
            <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
              {loadError}
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
              Select the PDF file again to relink it. Your reading progress, bookmarks, and notes will be preserved.
            </Text>

            <TouchableOpacity
              style={[styles.relinkButton, { backgroundColor: colors.primary }]}
              onPress={handleRelinkPdf}
              disabled={isRelinking}
              activeOpacity={0.8}
            >
              {isRelinking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.relinkButtonText}>Relink PDF File</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>
                Back to Library
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <PdfViewerCanvas
          ref={canvasRef}
          book={book}
          fileUri={resolvedUri || book.uri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onCoverGenerated={handleCoverGenerated}
          onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
        />
      )}

      {/* Top Header & Bottom Control Overlay HUD with Inset Safe Areas */}
      {!loading && !loadError && (
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
      )}
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
  errorCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  relinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 14,
    marginBottom: 12,
  },
  relinkButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
