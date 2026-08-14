import React, { useState } from 'react';
import {
  Alert,
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
import { SAMPLE_BOOKS } from '../../utils/sampleData';
import {
  BookPlus,
  Compass,
  FileDown,
  FolderOpen,
  HardDrive,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books, categories, addBook } = useLibrary();
  const [importing, setImporting] = useState(false);

  const handlePickDocument = async () => {
    try {
      setImporting(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const fileName = file.name || 'Imported PDF Book';
        const title = fileName.replace(/\.pdf$/i, '');

        const newBook = await addBook({
          title,
          author: 'Local File',
          uri: file.uri,
          fileSize: file.size || 2500000,
          totalPages: 36,
          coverColor: colors.primary,
          description: `Imported from local storage (${file.name})`,
          categoryIds: ['cat-all'],
        });

        Alert.alert('Book Imported', `"${title}" has been added to your library!`, [
          { text: 'Read Now', onPress: () => router.push(`/reader/${newBook.id}`) },
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to pick document.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportSample = async (sampleBook: typeof SAMPLE_BOOKS[0]) => {
    const existing = books.find((b) => b.title === sampleBook.title);
    if (existing) {
      Alert.alert('Already in Library', `"${sampleBook.title}" is already in your library.`, [
        { text: 'Open Reader', onPress: () => router.push(`/reader/${existing.id}`) },
        { text: 'OK' },
      ]);
      return;
    }

    const added = await addBook({
      title: sampleBook.title,
      author: sampleBook.author,
      description: sampleBook.description,
      uri: sampleBook.uri,
      fileSize: sampleBook.fileSize,
      totalPages: sampleBook.totalPages,
      coverColor: sampleBook.coverColor,
      categoryIds: sampleBook.categoryIds,
    });

    Alert.alert('Sample Added', `"${added.title}" added to your library.`, [
      { text: 'Start Reading', onPress: () => router.push(`/reader/${added.id}`) },
      { text: 'OK' },
    ]);
  };

  const totalReadingMins = books.reduce((acc, b) => acc + (b.readingTimeMinutes || 0), 0);
  const totalBookmarks = books.reduce((acc, b) => acc + (b.bookmarks?.length || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Explore & Add Books</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Import local PDF files or sample catalogs
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
        >
          <View style={[styles.heroIconBg, { backgroundColor: colors.primary }]}>
            <FolderOpen size={28} color={colors.onPrimary} />
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              Pick PDF from Device
            </Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>
              Select any local PDF file from your phone storage or Downloads folder.
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
              Library Statistics
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{books.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Books</Text>
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

        {/* Sample Book Catalog Section */}
        <View style={styles.sectionHeader}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Sample eBooks Catalog
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Tap to add sample PDF eBooks with pre-configured webtoon continuous scrolling & metadata.
        </Text>

        {SAMPLE_BOOKS.map((sample) => {
          const isAdded = books.some((b) => b.title === sample.title);

          return (
            <TouchableOpacity
              key={sample.id}
              style={[
                styles.sampleCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => handleImportSample(sample)}
              activeOpacity={0.7}
            >
              <View style={[styles.sampleCover, { backgroundColor: sample.coverColor || colors.primary }]}>
                <Text style={styles.sampleCoverText}>
                  {sample.title.substring(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.sampleDetails}>
                <Text style={[styles.sampleTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {sample.title}
                </Text>
                <Text style={[styles.sampleAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                  {sample.author}
                </Text>
                <Text style={[styles.sampleDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {sample.description}
                </Text>
              </View>

              <View style={styles.sampleAction}>
                {isAdded ? (
                  <View style={[styles.addedBadge, { backgroundColor: '#4CAF50' }]}>
                    <CheckCircle size={16} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={[styles.addBadge, { backgroundColor: colors.primary }]}>
                    <FileDown size={16} color={colors.onPrimary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    marginTop: 2,
    lineHeight: 16,
  },
  heroActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats
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
  // Catalog
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  sampleCover: {
    width: 44,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sampleCoverText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sampleDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sampleAuthor: {
    fontSize: 11,
    marginTop: 1,
  },
  sampleDesc: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
  },
  sampleAction: {
    padding: 4,
  },
  addBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
