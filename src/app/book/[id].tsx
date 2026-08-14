import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle,
  Clock,
  FolderKanban,
  Play,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { books, categories, updateBookCategories, deleteBook } = useLibrary();

  const book = books.find((b) => b.id === id);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
    Alert.alert('Remove Book', `Are you sure you want to remove "${book.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBook(book.id);
          router.replace('/(tabs)/index');
        },
      },
    ]);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          Book Information
        </Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleDelete}>
          <Trash2 size={20} color={colors.danger} />
        </TouchableOpacity>
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

            {/* Reading Status Tag */}
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
            </View>

            {/* Rating Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  color={star <= (book.rating || 0) ? '#FFC107' : colors.surfaceVariant}
                  fill={star <= (book.rating || 0) ? '#FFC107' : 'transparent'}
                />
              ))}
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

        {/* Progress Card */}
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
            <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
              <FolderKanban size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesChipsRow}>
            {book.categoryIds.map((catId) => {
              const catObj = categories.find((c) => c.id === catId);
              if (!catObj) return null;
              return (
                <View
                  key={catId}
                  style={[styles.catChip, { backgroundColor: colors.primaryContainer }]}
                >
                  <Text style={[styles.catChipText, { color: colors.primary }]}>
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
              <Text style={[styles.readActionText, { color: colors.onPrimary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  starsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
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
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
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
    marginTop: 4,
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
