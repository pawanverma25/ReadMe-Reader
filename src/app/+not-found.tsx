import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, usePathname, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTheme } from '../contexts/ThemeContext';
import { useLibrary } from '../contexts/LibraryContext';
import { handleExternalPdfUri, normalizeExternalPdfUri } from '../utils/fileImport';
import { BookOpen } from 'lucide-react-native';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { books, addBook } = useLibrary();
  const [isOpeningFile, setIsOpeningFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;

    let isMounted = true;

    async function handleIntentRoute() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const candidateUrl = initialUrl || pathname;

        if (!candidateUrl) return;

        const { isPdfCandidate } = normalizeExternalPdfUri(candidateUrl);
        if (!isPdfCandidate) return;

        hasHandledRef.current = true;
        if (isMounted) setIsOpeningFile(true);

        const bookId = await handleExternalPdfUri(candidateUrl, {
          books,
          addBook,
          router,
        });

        if (!bookId && isMounted) {
          setIsOpeningFile(false);
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
  }, []);

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
