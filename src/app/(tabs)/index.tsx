import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { SortOption, useLibrary } from '../../contexts/LibraryContext';
import { CategoryTabs } from '../../components/library/CategoryTabs';
import { BookCard } from '../../components/library/BookCard';
import {
  ArrowUpDown,
  Grid,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  X,
  BookPlus,
} from 'lucide-react-native';

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    books,
    categories,
    activeCategoryId,
    setActiveCategoryId,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
  } = useLibrary();

  const [isSearching, setIsSearching] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Filter books by active category and search query
  const filteredBooks = books.filter((b) => {
    let matchesCategory = true;
    if (activeCategoryId === 'cat-reading') {
      matchesCategory = b.status === 'reading';
    } else if (activeCategoryId === 'cat-favorites') {
      matchesCategory = b.categoryIds.includes('cat-favorites') || b.rating === 5;
    } else if (activeCategoryId === 'cat-completed') {
      matchesCategory = b.status === 'completed';
    } else if (activeCategoryId !== 'cat-all') {
      matchesCategory = b.categoryIds.includes(activeCategoryId);
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOption === 'title') return a.title.localeCompare(b.title);
    if (sortOption === 'lastRead')
      return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
    if (sortOption === 'progress') {
      const progA = a.currentPage / (a.totalPages || 1);
      const progB = b.currentPage / (b.totalPages || 1);
      return progB - progA;
    }
    if (sortOption === 'dateAdded')
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    return 0;
  });

  const getCategoryCount = (catId: string) => {
    if (catId === 'cat-all') return books.length;
    if (catId === 'cat-reading') return books.filter((b) => b.status === 'reading').length;
    if (catId === 'cat-favorites')
      return books.filter((b) => b.categoryIds.includes('cat-favorites') || b.rating === 5).length;
    if (catId === 'cat-completed') return books.filter((b) => b.status === 'completed').length;
    return books.filter((b) => b.categoryIds.includes(catId)).length;
  };

  const toggleViewMode = () => {
    if (viewMode === 'grid') setViewMode('compact');
    else if (viewMode === 'compact') setViewMode('list');
    else setViewMode('grid');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {isSearching ? (
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search library books & authors..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.appTitle, { color: colors.textPrimary }]}>ReadMe</Text>
              <Text style={[styles.subTitle, { color: colors.primary }]}>Library</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => setIsSearching(true)}
              >
                <Search size={22} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionIcon} onPress={toggleViewMode}>
                {viewMode === 'grid' ? (
                  <LayoutGrid size={22} color={colors.textPrimary} />
                ) : viewMode === 'compact' ? (
                  <Grid size={22} color={colors.textPrimary} />
                ) : (
                  <List size={22} color={colors.textPrimary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => setShowSortModal(true)}
              >
                <ArrowUpDown size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        onManageCategories={() => router.push('/category-manager')}
        getCategoryCount={getCategoryCount}
      />

      {/* Book Grid / List */}
      {sortedBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookPlus size={54} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Books Found</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            {searchQuery
              ? `No books match "${searchQuery}"`
              : 'This library category is empty. Import a PDF book or select another category.'}
          </Text>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/explore')}
          >
            <Text style={[styles.importBtnText, { color: colors.onPrimary }]}>
              + Import PDF Book
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedBooks}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'list' ? 1 : viewMode === 'compact' ? 3 : 2}
          key={viewMode} // Force re-render when switching grid columns
          contentContainerStyle={styles.listPadding}
          columnWrapperStyle={viewMode !== 'list' ? styles.columnWrapper : undefined}
          renderItem={({ item }) => (
            <BookCard
              book={item}
              viewMode={viewMode}
              onPress={() => router.push(`/reader/${item.id}`)}
              onLongPress={() => router.push(`/book/${item.id}`)}
            />
          )}
        />
      )}

      {/* Floating Add Book FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/explore')}
        activeOpacity={0.8}
      >
        <Plus size={26} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Sort & View Filter Modal */}
      <Modal visible={showSortModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.sortModalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Filter & Sort Library
              </Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.primary }]}>SORT BY</Text>
            {(
              [
                { id: 'lastRead', label: 'Last Read Timestamp' },
                { id: 'title', label: 'Book Title (A-Z)' },
                { id: 'progress', label: 'Reading Completion %' },
                { id: 'dateAdded', label: 'Date Added' },
              ] as { id: SortOption; label: string }[]
            ).map((opt) => {
              const isSelected = sortOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.sortItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { borderColor: colors.primary, backgroundColor: colors.surfaceVariant },
                  ]}
                  onPress={() => {
                    setSortOption(opt.id);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortItemText,
                      { color: colors.textPrimary },
                      isSelected && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  listPadding: {
    padding: 14,
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  importBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  importBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sortModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1,
  },
  sortItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sortItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
