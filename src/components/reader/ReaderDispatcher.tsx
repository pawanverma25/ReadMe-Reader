import React, { forwardRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react-native';
import { Book, ReaderSettings } from '../../types';
import { formatRegistry } from '../../formats';
import { PdfViewerCanvas, PdfViewerCanvasRef } from './PdfViewerCanvas';
import { TextViewerCanvas } from './TextViewerCanvas';

export interface ReaderDispatcherProps {
  book: Book;
  fileUri: string;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, total?: number) => void;
  onCoverGenerated?: (coverDataUrl: string) => void;
  onToggleOverlay: () => void;
}

export const ReaderDispatcher = forwardRef<PdfViewerCanvasRef, ReaderDispatcherProps>(
  (
    {
      book,
      fileUri,
      settings,
      currentPage,
      onPageChange,
      onCoverGenerated,
      onToggleOverlay,
    },
    ref
  ) => {
    const router = useRouter();
    const detectedFormat = formatRegistry.detectFormat(book.uri, book.mimeType);
    const formatId = (book.format || detectedFormat.id).toLowerCase();
    const formatDef = formatRegistry.getFormatById(formatId) || detectedFormat;

    // 1. PDF Documents
    if (formatId === 'pdf') {
      return (
        <PdfViewerCanvas
          ref={ref}
          book={book}
          fileUri={fileUri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onCoverGenerated={onCoverGenerated}
          onToggleOverlay={onToggleOverlay}
        />
      );
    }

    // 2. Text and Markdown Documents
    if (formatId === 'txt') {
      return (
        <TextViewerCanvas
          book={book}
          fileUri={fileUri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onCoverGenerated={onCoverGenerated}
          onToggleOverlay={onToggleOverlay}
        />
      );
    }

    // 3. Custom Registered Reader Component
    if (formatDef.readerComponent) {
      const CustomReader = formatDef.readerComponent;
      return (
        <CustomReader
          book={book}
          fileUri={fileUri}
          settings={settings}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onCoverGenerated={onCoverGenerated}
          onToggleOverlay={onToggleOverlay}
        />
      );
    }

    // 4. Fallback for registered formats whose reader engine is in development (e.g. EPUB / CBZ)
    return (
      <View style={styles.fallbackContainer}>
        <View style={[styles.iconBox, { backgroundColor: formatDef.themeColor }]}>
          <Layers size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.fallbackTitle}>{formatDef.name}</Text>
        <Text style={styles.fallbackBadge}>{formatDef.badge}</Text>
        <Text style={styles.fallbackDesc}>
          This file was successfully ingested into your library. The dedicated native rendering engine for {formatDef.name} ({formatDef.badge}) is being prepared.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.backButtonText}>Back to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }
);

ReaderDispatcher.displayName = 'ReaderDispatcher';

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#0E0D14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  fallbackBadge: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
  },
  fallbackDesc: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 320,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
