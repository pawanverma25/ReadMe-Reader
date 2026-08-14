import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { AlertConfig, ThemedAlert } from '../../components/common/ThemedAlert';
import {
  BookPlus,
  Compass,
  FolderOpen,
  HardDrive,
} from 'lucide-react-native';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books, categories, addBook } = useLibrary();
  const [importing, setImporting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (config: Omit<AlertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handlePickDocument = async () => {
    try {
      setImporting(true);
      // Strictly filter to PDF documents
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const fileName = file.name || 'Imported PDF Book';
        const title = fileName.replace(/\.pdf$/i, '');

        const newBook = await addBook({
          title,
          author: 'Local PDF File',
          uri: file.uri,
          fileSize: file.size || 2500000,
          totalPages: 40,
          coverColor: colors.primary,
          description: `Imported from local file storage (${file.name})`,
          categoryIds: ['cat-all'],
        });

        showAlert({
          title: 'PDF Imported Successfully',
          message: `"${title}" has been added to your local library!`,
          type: 'success',
          confirmText: 'Read Now',
          cancelText: 'Library',
          onConfirm: () => {
            hideAlert();
            router.push(`/reader/${newBook.id}`);
          },
          onCancel: () => {
            hideAlert();
            router.push('/(tabs)');
          },
        });
      }
    } catch (error) {
      console.error('PDF file pick error:', error);
      showAlert({
        title: 'Import Error',
        message: 'Could not import selected PDF file. Please select a valid .pdf file.',
        type: 'error',
        confirmText: 'OK',
        onConfirm: hideAlert,
      });
    } finally {
      setImporting(false);
    }
  };

  const totalReadingMins = books.reduce((acc, b) => acc + (b.readingTimeMinutes || 0), 0);
  const totalBookmarks = books.reduce((acc, b) => acc + (b.bookmarks?.length || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Import PDF Books</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Add local PDF eBooks & document files
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* Main Import Hero Card */}
        <TouchableOpacity
          style={[
            styles.heroCard,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
          ]}
          onPress={handlePickDocument}
          activeOpacity={0.8}
          disabled={importing}
        >
          <View style={[styles.heroIconBg, { backgroundColor: colors.primary }]}>
            <FolderOpen size={28} color={colors.onPrimary} />
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              {importing ? 'Importing PDF...' : 'Select PDF File from Device'}
            </Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Tap to browse your device files and select any .pdf book or document.
            </Text>
          </View>

          <View style={[styles.heroActionBtn, { backgroundColor: colors.primary }]}>
            <BookPlus size={20} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Stats Summary Card */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statsHeader}>
            <HardDrive size={18} color={colors.primary} />
            <Text style={[styles.statsHeaderTitle, { color: colors.textPrimary }]}>
              Library Overview
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{books.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>PDF Books</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{categories.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{totalBookmarks}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Bookmarks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{totalReadingMins}m</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Read Time</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Themed Mihon Alert */}
      <ThemedAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
});
