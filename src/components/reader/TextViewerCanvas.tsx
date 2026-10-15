import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { ReaderEngineProps } from '../../formats/types';

export const TextViewerCanvas: React.FC<ReaderEngineProps> = ({
  book,
  fileUri,
  settings,
  currentPage,
  onPageChange,
  onToggleOverlay,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTextFile() {
      try {
        setLoading(true);
        setError(null);

        // Text files are plain text, read safely with UTF-8
        const text = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (isMounted) {
          setContent(text);
          // Estimate pages based on word/character count (~2000 chars per standard page)
          const estimatedPages = Math.max(1, Math.ceil(text.length / 2000));
          onPageChange(currentPage || 1, estimatedPages);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to read text file');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTextFile();

    return () => {
      isMounted = false;
    };
  }, [fileUri]);

  // Reader theme colors
  const themeStyles = useMemo(() => {
    switch (settings.readerTheme) {
      case 'oled':
        return { bg: '#000000', text: '#E5E5E5' };
      case 'sepia':
        return { bg: '#F5EBE1', text: '#3E2723' };
      case 'light':
        return { bg: '#FAFAFA', text: '#111111' };
      case 'dark':
      default:
        return { bg: '#18181B', text: '#E4E4E7' };
    }
  }, [settings.readerTheme]);

  const sidePadding = Math.max(16, (settings.sidePaddingLongStrip || 4) * 4);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeStyles.bg }]}>
        <ActivityIndicator size="large" color={themeStyles.text} />
        <Text style={[styles.loadingText, { color: themeStyles.text }]}>Loading text document...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeStyles.bg }]}>
        <Text style={[styles.errorText, { color: '#EF4444' }]}>Error reading document</Text>
        <Text style={[styles.errorSubtext, { color: themeStyles.text }]}>{error}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onToggleOverlay}
      style={[styles.container, { backgroundColor: themeStyles.bg }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: sidePadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.textContent,
            {
              color: themeStyles.text,
              fontSize: 16,
              lineHeight: 26,
            },
          ]}
          selectable
        >
          {content}
        </Text>
      </ScrollView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 80,
  },
  textContent: {
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
});
