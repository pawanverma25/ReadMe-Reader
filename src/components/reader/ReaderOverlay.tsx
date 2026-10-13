import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, Bookmark as BookmarkType, ReaderSettings, ReaderTheme, ReadingMode } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ListOrdered,
  MessageSquare,
  Share2,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react-native';
import { MihonSlider } from '../common/MihonSlider';

interface ReaderOverlayProps {
  book: Book;
  settings: ReaderSettings;
  currentPage: number;
  totalPages: number;
  visible: boolean;
  onBack: () => void;
  onPageSelect: (page: number) => void;
  onToggleBookmark: () => void;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
}

type ReaderSheetTab = 'reading_mode' | 'general' | 'custom_filter';

export const ReaderOverlay: React.FC<ReaderOverlayProps> = ({
  book,
  settings,
  currentPage,
  totalPages,
  visible,
  onBack,
  onPageSelect,
  onToggleBookmark,
  onUpdateSettings,
}) => {
  const { colors } = useTheme();
  const { updateBookmarkNote, deleteBookmark } = useLibrary();
  const insets = useSafeAreaInsets();
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [showReaderSettingsSheet, setShowReaderSettingsSheet] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<ReaderSheetTab>('reading_mode');
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [bookmarkNoteInput, setBookmarkNoteInput] = useState('');

  if (!visible) return null;

  const isBookmarked = book.bookmarks.some((b) => b.page === currentPage);
  const progressPct = Math.round((currentPage / (totalPages || 1)) * 100);

  const handleJumpSubmit = () => {
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageSelect(pageNum);
      setShowJumpModal(false);
      setJumpPageInput('');
    }
  };

  const handleOpenWith = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
        return;
      }
      await Sharing.shareAsync(book.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Open ${book.title} with...`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err: any) {
      console.warn('[ReaderOverlay] Error opening with external app:', err);
    }
  };

  const handleOpenCommentModal = (bm: BookmarkType) => {
    setEditingBookmark(bm);
    setBookmarkNoteInput(bm.note || '');
  };

  const handleSaveComment = async () => {
    if (!editingBookmark) return;
    await updateBookmarkNote(book.id, editingBookmark.id, bookmarkNoteInput.trim());
    setEditingBookmark(null);
    setBookmarkNoteInput('');
  };

  const handleDeleteBookmark = async (bmId: string) => {
    await deleteBookmark(book.id, bmId);
  };

  const topPadding = insets.top > 0 ? insets.top : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 14;

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Top Header Bar with Safe Area Top Inset */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            paddingTop: topPadding,
            height: 56 + topPadding,
          },
        ]}
      >
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {book.author}
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleOpenWith}
            activeOpacity={0.7}
            accessibilityLabel="Open with or Share"
          >
            <Share2 size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={onToggleBookmark} activeOpacity={0.7}>
            {isBookmarked ? (
              <BookmarkCheck size={22} color={colors.primary} />
            ) : (
              <Bookmark size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowBookmarksDrawer(true)}
            activeOpacity={0.7}
          >
            <ListOrdered size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowReaderSettingsSheet(true)}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Clean Bottom Control HUD Bar with Safe Area Bottom Inset */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <View style={styles.pageStatusRow}>
          <TouchableOpacity
            style={styles.pageNavBtn}
            onPress={() => currentPage > 1 && onPageSelect(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={22} color={currentPage <= 1 ? colors.border : colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pageIndicatorPill, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => {
              setJumpPageInput(String(currentPage));
              setShowJumpModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageIndicatorText, { color: colors.textPrimary }]}>
              Page {currentPage} of {totalPages} ({progressPct}%)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pageNavBtn}
            onPress={() => currentPage < totalPages && onPageSelect(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight
              size={22}
              color={currentPage >= totalPages ? colors.border : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Jump To Page Dialog */}
      <Modal visible={showJumpModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowJumpModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowJumpModal(false)} />
          <View style={[styles.jumpModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Jump to Page</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter page number between 1 and {totalPages}
            </Text>

            <TextInput
              style={[
                styles.jumpInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              keyboardType="number-pad"
              value={jumpPageInput}
              onChangeText={setJumpPageInput}
              placeholder={`1 - ${totalPages}`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowJumpModal(false)}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleJumpSubmit}
              >
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side Drawer Bookmarks Panel */}
      <Modal visible={showBookmarksDrawer} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowBookmarksDrawer(false)}>
        <View style={styles.drawerOverlay}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowBookmarksDrawer(false)} />
          <View style={[styles.bookmarksDrawer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Bookmarks ({book.bookmarks.length})
              </Text>
              <TouchableOpacity onPress={() => setShowBookmarksDrawer(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.bookmarksListContent} showsVerticalScrollIndicator={false}>
              {book.bookmarks.length === 0 ? (
                <View style={styles.emptyBmBox}>
                  <Bookmark size={40} color={colors.textSecondary} style={{ opacity: 0.4 }} />
                  <Text style={[styles.emptyBmText, { color: colors.textSecondary }]}>
                    No saved bookmarks for this book yet. Tap the bookmark icon in the top header to pin your favorite pages!
                  </Text>
                </View>
              ) : (
                book.bookmarks.map((bm) => (
                  <View
                    key={bm.id}
                    style={[
                      styles.bookmarkCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.bmMainTouchable}
                      onPress={() => {
                        onPageSelect(bm.page);
                        setShowBookmarksDrawer(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.bmBadge, { backgroundColor: colors.primaryContainer }]}>
                        <Text style={[styles.bmBadgeText, { color: colors.primary }]}>
                          Page {bm.page}
                        </Text>
                      </View>

                      <View style={styles.bmInfo}>
                        <Text style={[styles.bmTitleText, { color: colors.textPrimary }]}>
                          {bm.title || `Bookmark Page ${bm.page}`}
                        </Text>
                        <Text style={[styles.bmDateText, { color: colors.textSecondary }]}>
                          Saved on {new Date(bm.createdAt).toLocaleDateString()}
                        </Text>
                        {Boolean(bm.note) && (
                          <View style={[styles.bmNoteBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                            <MessageSquare size={13} color={colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
                            <Text style={[styles.bmNoteText, { color: colors.textPrimary }]}>
                              {bm.note}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.bmActionCol}>
                      <TouchableOpacity
                        style={[styles.bmActionBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleOpenCommentModal(bm)}
                        activeOpacity={0.7}
                        accessibilityLabel="Add or edit note"
                      >
                        {bm.note ? (
                          <Edit3 size={15} color={colors.primary} />
                        ) : (
                          <MessageSquare size={15} color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.bmActionBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleDeleteBookmark(bm.id)}
                        activeOpacity={0.7}
                        accessibilityLabel="Delete bookmark"
                      >
                        <Trash2 size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Bookmark Note Modal */}
      <Modal visible={Boolean(editingBookmark)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setEditingBookmark(null)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditingBookmark(null)} />
          <View style={[styles.commentModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.commentModalHeader}>
              <View style={styles.commentModalHeaderTitle}>
                <MessageSquare size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary, marginLeft: 8 }]}>
                  Bookmark Note (Page {editingBookmark?.page})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingBookmark(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Add annotations, comments, or thoughts for this page.
            </Text>

            <TextInput
              style={[
                styles.commentInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              multiline
              numberOfLines={4}
              value={bookmarkNoteInput}
              onChangeText={setBookmarkNoteInput}
              placeholder="Write a note or comment..."
              placeholderTextColor={colors.textSecondary}
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setEditingBookmark(null)}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveComment}
              >
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-Reader Bottom Settings Sheet */}
      <Modal visible={showReaderSettingsSheet} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowReaderSettingsSheet(false)}>
        <View style={styles.sheetBackdropOverlay}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowReaderSettingsSheet(false)}
          />
          <View style={[styles.readerSettingsSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Sheet Header */}
            <View style={styles.sheetHeaderTitleRow}>
              <Text style={[styles.sheetHeaderTitle, { color: colors.textPrimary }]}>Reader Settings</Text>
              <TouchableOpacity onPress={() => setShowReaderSettingsSheet(false)} style={{ padding: 4 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Sheet Tabs Header */}
            <View style={[styles.sheetTabsHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.sheetTab, activeSheetTab === 'reading_mode' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveSheetTab('reading_mode')}
              >
                <Text
                  style={[
                    styles.sheetTabText,
                    { color: colors.textSecondary },
                    activeSheetTab === 'reading_mode' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Reading mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetTab, activeSheetTab === 'general' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveSheetTab('general')}
              >
                <Text
                  style={[
                    styles.sheetTabText,
                    { color: colors.textSecondary },
                    activeSheetTab === 'general' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  General
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetTab, activeSheetTab === 'custom_filter' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveSheetTab('custom_filter')}
              >
                <Text
                  style={[
                    styles.sheetTabText,
                    { color: colors.textSecondary },
                    activeSheetTab === 'custom_filter' && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  Custom filter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sheet Tab Contents */}
            <ScrollView style={{ maxHeight: 340, paddingVertical: 8 }}>
              {activeSheetTab === 'reading_mode' && (
                <View>
                  <Text style={[styles.sheetSectionTitle, { color: colors.primary }]}>Reading mode</Text>
                  <View style={styles.pillsRow}>
                    {(['long_strip', 'single_page_h', 'single_page_v'] as ReadingMode[]).map((m) => {
                      const isActive = settings.readingMode === m;
                      const label = m === 'long_strip' ? 'Long strip' : m === 'single_page_h' ? 'Paged (LTR)' : 'Paged (Vertical)';
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.optionPill,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => onUpdateSettings({ readingMode: m })}
                        >
                          <Text style={[styles.optionPillText, { color: isActive ? colors.onPrimary : colors.textPrimary }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Mihon-Style Side Padding Slider Section (Per Reading Mode) */}
                  <View style={styles.sidePaddingSection}>
                    <MihonSlider
                      label={
                        settings.readingMode === 'long_strip'
                          ? 'Side padding (Long Strip)'
                          : settings.readingMode === 'single_page_v'
                          ? 'Side padding (Vertical)'
                          : 'Side padding (Paged LTR)'
                      }
                      value={
                        settings.readingMode === 'long_strip'
                          ? (settings.sidePaddingLongStrip ?? settings.sidePadding ?? 0)
                          : settings.readingMode === 'single_page_v'
                          ? (settings.sidePaddingPagedVertical ?? settings.sidePadding ?? 0)
                          : (settings.sidePaddingPagedLtr ?? 0)
                      }
                      min={0}
                      max={25}
                      step={1}
                      helpText="Adjusts side margins specifically for this reading mode (0% - 25%)."
                      onChange={(val) => {
                        if (settings.readingMode === 'long_strip') {
                          onUpdateSettings({ sidePaddingLongStrip: val, sidePadding: val });
                        } else if (settings.readingMode === 'single_page_v') {
                          onUpdateSettings({ sidePaddingPagedVertical: val });
                        } else {
                          onUpdateSettings({ sidePaddingPagedLtr: val });
                        }
                      }}
                    />
                  </View>
                </View>
              )}

              {activeSheetTab === 'general' && (
                <View>
                  <Text style={[styles.sheetSectionTitle, { color: colors.primary }]}>Background color</Text>
                  <View style={styles.pillsRow}>
                    {(['oled', 'dark', 'sepia', 'light'] as ReaderTheme[]).map((thm) => {
                      const isActive = settings.readerTheme === thm;
                      return (
                        <TouchableOpacity
                          key={thm}
                          style={[
                            styles.optionPill,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => onUpdateSettings({ readerTheme: thm })}
                        >
                          <Text style={[styles.optionPillText, { color: isActive ? colors.onPrimary : colors.textPrimary }]}>
                            {thm.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={[styles.settingRowSheet, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.settingTitleSheet, { color: colors.textPrimary }]}>Keep screen awake</Text>
                    <Switch
                      value={settings.keepScreenOn}
                      onValueChange={(keepScreenOn) => onUpdateSettings({ keepScreenOn })}
                      trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.settingRowSheet, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.settingTitleSheet, { color: colors.textPrimary }]}>Double tap to zoom</Text>
                    <Switch
                      value={settings.doubleTapToZoom}
                      onValueChange={(doubleTapToZoom) => onUpdateSettings({ doubleTapToZoom })}
                      trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              )}

              {activeSheetTab === 'custom_filter' && (
                <View>
                  <Text style={[styles.sheetSectionTitle, { color: colors.primary }]}>Display Filters</Text>

                  <View style={[styles.settingRowSheet, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.settingTitleSheet, { color: colors.textPrimary }]}>Grayscale (Black & White)</Text>
                    <Switch
                      value={Boolean(settings.grayscale)}
                      onValueChange={(grayscale) => onUpdateSettings({ grayscale })}
                      trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.settingRowSheet, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.settingTitleSheet, { color: colors.textPrimary }]}>Inverted Colors (Night Mode)</Text>
                    <Switch
                      value={Boolean(settings.inverted)}
                      onValueChange={(inverted) => onUpdateSettings({ inverted })}
                      trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeSheetBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowReaderSettingsSheet(false)}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  iconBtn: {
    padding: 10,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageNavBtn: {
    padding: 8,
  },
  pageIndicatorPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  jumpModalCard: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  jumpInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  // Bookmarks Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  bookmarksDrawer: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 14,
    marginBottom: 14,
  },
  bookmarksListContent: {
    paddingBottom: 20,
  },
  emptyBmBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  emptyBmText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  bmMainTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bmBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bmTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bmDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  bmNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  bmNoteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    fontStyle: 'italic',
  },
  bmActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  bmActionBtn: {
    padding: 7,
    borderRadius: 8,
  },
  // Comment Modal
  commentModalCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentModalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 18,
    textAlignVertical: 'top',
  },
  // Settings Sheet
  sheetBackdropOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  readerSettingsSheet: {
    width: '100%',
    maxWidth: 460,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetTabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sheetTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sheetTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Mihon-Style Slider
  sidePaddingSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  sliderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingRowSheet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  settingTitleSheet: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeSheetBtn: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
});
