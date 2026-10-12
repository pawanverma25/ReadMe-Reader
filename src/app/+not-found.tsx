import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, usePathname, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '../contexts/ThemeContext';
import { useLibrary } from '../contexts/LibraryContext';
import { saveBookFilePermanently } from '../utils/storage';
import { BookOpen } from 'lucide-react-native';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { books, addBook } = useLibrary();
  const [isOpeningFile, setIsOpeningFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleIntentRoute() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const candidateUrl = initialUrl || pathname;

        if (!candidateUrl) return;

        const lower = candidateUrl.toLowerCase();
        const isPdfCandidate =
          lower.includes('.pdf') ||
          lower.includes('.provider') ||
          candidateUrl.startsWith('content://') ||
          candidateUrl.startsWith('file://');

        if (!isPdfCandidate) {
          return;
        }

        setIsOpeningFile(true);

        // Reconstruct Android Content URI or direct file URI
        let realUri = candidateUrl;
        if (candidateUrl.startsWith('readme://')) {
          // Convert readme://com.google.android.apps... back to content://com.google.android.apps...
          realUri = candidateUrl.replace(/^readme:\/\//, 'content://');
        }

        // Check if there is an embedded file:/// in the provider URL (e.g. file%253A%252F%252F...)
        if (realUri.includes('file%253A') || realUri.includes('file%3A')) {
          try {
            const decodedTwice = decodeURIComponent(decodeURIComponent(realUri));
            const match = decodedTwice.match(/file:\/\/\/[^\s&]+/);
            if (match && match[0]) {
              realUri = match[0];
            }
          } catch (_) {}
        }

        // Check if book already exists in library
        const existing = books.find((b) => b.uri === realUri || b.uri === candidateUrl);
        if (existing) {
          if (isMounted) {
            router.replace(`/reader/${existing.id}`);
          }
          return;
        }

        // Extract readable filename
        let fileName = 'Document.pdf';
        try {
          const decoded = decodeURIComponent(decodeURIComponent(candidateUrl));
          const parts = decoded.split('/');
          const last = parts[parts.length - 1];
          if (last) {
            fileName = last.endsWith('.pdf') ? last : `${last}.pdf`;
          }
        } catch (_) {}

        const title = fileName.replace(/\.pdf$/i, '').replace(/[_+]/g, ' ') || 'External Document';
        const permanentUri = await saveBookFilePermanently(realUri, fileName);

        const newBook = await addBook({
          title,
          author: 'External Document',
          uri: permanentUri,
          fileSize: 2000000,
          totalPages: 1,
          categoryIds: ['cat-all'],
        });

        if (isMounted) {
          router.replace(`/reader/${newBook.id}`);
        }
      } catch (err: any) {
        console.error('[NotFoundScreen] Failed to parse intent route:', err);
        if (isMounted) {
          setIsOpeningFile(false);
          setErrorMsg('Could not open document from file manager.');
        }
      }
    }

    handleIntentRoute();

    return () => {
      isMounted = false;
    };
  }, [pathname, books]);

  if (isOpeningFile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Opening PDF Document...</Text>
          <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>
            Importing file into ReadMe reader
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: colors.primaryContainer }]}>
          <BookOpen size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Page Not Found</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {errorMsg || 'The requested page or document could not be located.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Go to Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 24,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
