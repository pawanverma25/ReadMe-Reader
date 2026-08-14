import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
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

  // Keep screen awake while reading
  if (settings.keepScreenOn) {
    useKeepAwake();
  }

  const book = books.find((b) => b.id === id);
  const [currentPage, setCurrentPage] = useState<number>(book?.currentPage || 1);
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);

  useEffect(() => {
    if (book) {
      setCurrentPage(book.currentPage || 1);
    }
  }, [book?.id]);

  if (!book) {
    router.replace('/(tabs)/index');
    return null;
  }

  const handlePageChange = (page: number, totalPages: number) => {
    setCurrentPage(page);
    updateBookProgress(book.id, page, totalPages);
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
    updateBookProgress(book.id, page, book.totalPages);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar hidden={!overlayVisible} />

      {/* Main Canvas Viewer */}
      <PdfViewerCanvas
        book={book}
        settings={settings}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onToggleOverlay={() => setOverlayVisible((prev) => !prev)}
      />

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
});
