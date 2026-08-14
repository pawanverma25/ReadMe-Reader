import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { AlertConfig, ThemedAlert } from '../../components/common/ThemedAlert';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle,
  Clock,
  FolderKanban,
  Heart,
  Play,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { books, categories, updateBookCategories, toggleFavorite, deleteBook } = useLibrary();

  const book = books.find((b) => b.id === id);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>Book Not Found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={{ color: colors.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round(((book.currentPage || 1) / (book.totalPages || 1)) * 100)
  );

  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Remove Book',
      message: `Are you sure you want to remove "${book.title}" from your library? This will delete local metadata and progress.`,
      type: 'warning',
      confirmText: 'Remove Book',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await deleteBook(book.id);
        router.replace('/(tabs)');
      },
      onCancel: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const handleToggleCategory = async (catId: string) => {
    const isAssigned = book.categoryIds.includes(catId);
    let updatedCats: string[];
    if (isAssigned) {
      updatedCats = book.categoryIds.filter((c) => c !== catId);
    } else {
      updatedCats = [...book.categoryIds, catId];
    }
    await updateBookCategories(book.id, updatedCats);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Book Details
        </Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => toggleFavorite(book.id)}
            activeOpacity={0.7}
          >
            <Heart
              size={22}
              color={book.isFavorite ? colors.primary : colors.textPrimary}
              fill={book.isFavorite ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Trash2 size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Hero Banner */}
        <View style={styles.coverHeroContainer}>
          <View
            style={[
              styles.coverVisual,
              { backgroundColor: book.coverColor || colors.primary },
            ]}
          >
            <Text style={styles.coverText}>{book.title.substring(0, 2).toUpperCase()}</Text>
          </View>

          <View style={styles.metaContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{book.title}</Text>
            <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>

            {/* Status & Favorite Tags */}
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      book.status === 'completed'
                        ? '#4CAF50'
                        : book.currentPage > 1
                        ? colors.primary
                        : colors.surfaceVariant,
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {book.status === 'completed'
                    ? 'COMPLETED'
                    : book.currentPage > 1
                    ? 'READING'
                    : 'UNREAD'}
                </Text>
              </View>

              {book.isFavorite && (
                <View style={[styles.statusBadge, { backgroundColor: '#FFC107', marginLeft: 6 }]}>
                  <Text style={[styles.statusText, { color: '#000000' }]}>FAVORITE</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Read Action Button */}
        <TouchableOpacity
          style={[styles.readActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/reader/${book.id}`)}
          activeOpacity={0.8}
        >
          <Play size={20} color={colors.onPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.readActionText, { color: colors.onPrimary }]}>
            {book.currentPage > 1 ? `Resume Page ${book.currentPage}` : 'Start Reading'}
          </Text>
        </TouchableOpacity>

        {/* Reading Progress Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Reading Progress</Text>

          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <BookOpen size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {book.currentPage} / {book.totalPages}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pages</Text>
            </View>

            <View style={styles.statBox}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {book.readingTimeMinutes || 0}m
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Time Read</Text>
            </View>

            <View style={styles.statBox}>
              <Bookmark size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {book.bookmarks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookmarks</Text>
            </View>
          </View>
        </View>

        {/* Assigned Categories Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Categories</Text>
            <TouchableOpacity
              style={[styles.manageCatBtn, { backgroundColor: colors.primaryContainer }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <FolderKanban size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.manageCatText, { color: colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesChipsRow}>
            {book.categoryIds.map((catId) => {
              const catObj = categories.find((c) => c.id === catId);
              if (!catObj) return null;
              return (
                <View
                  key={catId}
                  style={[styles.catChip, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.catChipText, { color: colors.textPrimary }]}>
                    {catObj.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Description Section */}
        {book.description && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {book.description}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Category Assignment Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Assign Categories
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {categories.map((cat) => {
                const isChecked = book.categoryIds.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catToggleRow,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => handleToggleCategory(cat.id)}
                  >
                    <Text style={[styles.catToggleName, { color: colors.textPrimary }]}>
                      {cat.name}
                    </Text>
                    {isChecked && <CheckCircle size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.readActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={[styles.readActionText, { color: colors.onPrimary }]}>Save Categories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Mihon Alert Dialog */}
      <ThemedAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    padding: 16,
  },
  coverHeroContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  coverVisual: {
    width: 100,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  coverText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  metaContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  author: {
    fontSize: 13,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  readActionBtn: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
  },
  readActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  manageCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  manageCatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  categoriesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  backBtn: {
    padding: 10,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  catToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  catToggleName: {
    fontSize: 14,
    fontWeight: '600',
  },
});
