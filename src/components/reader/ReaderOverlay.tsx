import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Book, ReaderSettings, ReaderTheme, ReadingMode } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListOrdered,
  Maximize2,
  Minimize2,
  Sliders,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';

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
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);
  const [showReaderSettingsSheet, setShowReaderSettingsSheet] = useState(false);
  const [activeSheetTab, setActiveSheetTab] = useState<ReaderSheetTab>('reading_mode');

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

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Top Header Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface }]}>
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
          <TouchableOpacity style={styles.iconBtn} onPress={onToggleBookmark} activeOpacity={0.7}>
            {isBookmarked ? (
              <BookmarkCheck size={22} color={colors.primary} />
            ) : (
              <Bookmark size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowBookmarksModal(true)}
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

      {/* Bottom Control Bar / Sheet */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        {/* Page Status & Jump Trigger */}
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

        {/* Quick Mode & Theme Selectors */}
        <View style={styles.quickSelectorsRow}>
          {/* Reading Mode Selector */}
          <View style={[styles.pillSegment, { backgroundColor: colors.surfaceVariant }]}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                settings.readingMode === 'long_strip' && [
                  styles.segmentBtnActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => onUpdateSettings({ readingMode: 'long_strip' })}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textSecondary },
                  settings.readingMode === 'long_strip' && { color: colors.onPrimary, fontWeight: '700' },
                ]}
              >
                Long Strip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                settings.readingMode !== 'long_strip' && [
                  styles.segmentBtnActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => onUpdateSettings({ readingMode: 'single_page_h' })}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textSecondary },
                  settings.readingMode !== 'long_strip' && { color: colors.onPrimary, fontWeight: '700' },
                ]}
              >
                Single Page
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reader Background Colors */}
          <View style={styles.readerThemesRow}>
            {(['oled', 'dark', 'sepia', 'light'] as ReaderTheme[]).map((thm) => {
              const isActive = settings.readerTheme === thm;
              const bgColors: Record<ReaderTheme, string> = {
                oled: '#000000',
                dark: '#16131B',
                sepia: '#F4ECD8',
                light: '#FFFFFF',
              };

              return (
                <TouchableOpacity
                  key={thm}
                  style={[
                    styles.themeDot,
                    { backgroundColor: bgColors[thm], borderColor: colors.border },
                    isActive && [styles.activeThemeDot, { borderColor: colors.primary }],
                  ]}
                  onPress={() => onUpdateSettings({ readerTheme: thm })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.themeDotLabel,
                      { color: thm === 'light' || thm === 'sepia' ? '#000' : '#FFF' },
                    ]}
                  >
                    {thm.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Jump To Page Modal */}
      <Modal visible={showJumpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
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

      {/* Bookmarks Modal */}
      <Modal visible={showBookmarksModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bookmarksSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Bookmarks ({book.bookmarks.length})
              </Text>
              <TouchableOpacity onPress={() => setShowBookmarksModal(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bookmarksList}>
              {book.bookmarks.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No bookmarks added yet for this book. Tap the bookmark icon in the top header to save key pages.
                </Text>
              ) : (
                book.bookmarks.map((bm) => (
                  <TouchableOpacity
                    key={bm.id}
                    style={[
                      styles.bookmarkItem,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      onPageSelect(bm.page);
                      setShowBookmarksModal(false);
                    }}
                  >
                    <View style={[styles.bmPageBadge, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.bmPageText, { color: colors.primary }]}>
                        Page {bm.page}
                      </Text>
                    </View>
                    <View style={styles.bmDetails}>
                      <Text style={[styles.bmTitle, { color: colors.textPrimary }]}>
                        {bm.title || `Page ${bm.page}`}
                      </Text>
                      <Text style={[styles.bmDate, { color: colors.textSecondary }]}>
                        {new Date(bm.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mihon In-Reader Bottom Settings Sheet (Matching Screenshots #16, #17, #18, #19, #20) */}
      <Modal visible={showReaderSettingsSheet} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.readerSettingsSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            <ScrollView style={{ maxHeight: 380, paddingVertical: 12 }}>
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

                  <Text style={[styles.sheetSectionTitle, { color: colors.primary, marginTop: 16 }]}>Side padding ({settings.sidePadding}%)</Text>
                  <View style={styles.sliderButtonsRow}>
                    {[0, 5, 10, 15, 20, 25].map((pad) => (
                      <TouchableOpacity
                        key={pad}
                        style={[
                          styles.padChip,
                          { backgroundColor: colors.surface },
                          settings.sidePadding === pad && { backgroundColor: colors.primary },
                        ]}
                        onPress={() => onUpdateSettings({ sidePadding: pad })}
                      >
                        <Text style={[styles.padChipText, { color: settings.sidePadding === pad ? colors.onPrimary : colors.textPrimary }]}>
                          {pad}%
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                    <Text style={[styles.settingTitleSheet, { color: colors.textPrimary }]}>Keep screen on</Text>
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
              <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>Apply & Close</Text>
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
    height: 64,
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
    paddingVertical: 14,
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
    marginBottom: 12,
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
  quickSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillSegment: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  segmentBtnActive: {
    borderRadius: 16,
  },
  segmentText: {
    fontSize: 12,
  },
  readerThemesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeThemeDot: {
    borderWidth: 2.5,
    transform: [{ scale: 1.1 }],
  },
  themeDotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
  bookmarksSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '75%',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookmarksList: {
    maxHeight: 350,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 24,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  bmPageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bmPageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bmDetails: {
    marginLeft: 12,
    flex: 1,
  },
  bmTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bmDate: {
    fontSize: 11,
    marginTop: 2,
  },
  // Mihon In-Reader Settings Sheet Styles
  readerSettingsSheet: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
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
  sliderButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  padChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  padChipText: {
    fontSize: 11,
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
