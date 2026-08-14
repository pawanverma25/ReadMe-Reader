import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { Bookmark, Clock, CheckCircle2 } from 'lucide-react-native';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onLongPress?: () => void;
  viewMode: 'grid' | 'compact' | 'list';
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  onLongPress,
  viewMode,
}) => {
  const { colors } = useTheme();

  const progressPercent = Math.min(
    100,
    Math.round(((book.currentPage || 1) / (book.totalPages || 1)) * 100)
  );

  const coverBg = book.coverColor || colors.primary;

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={[styles.listCover, { backgroundColor: coverBg }]}>
          <Text style={styles.coverInitials}>
            {book.title.substring(0, 2).toUpperCase()}
          </Text>
          {book.status === 'completed' && (
            <View style={styles.badgeTopRight}>
              <CheckCircle2 size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.listDetails}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
            {book.author}
          </Text>

          <View style={styles.progressRow}>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {book.currentPage} / {book.totalPages} ({progressPercent}%)
            </Text>
          </View>
        </View>

        {book.bookmarks.length > 0 && (
          <View style={styles.bookmarkBadge}>
            <Bookmark size={14} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Grid / Compact Grid View
  const isCompact = viewMode === 'compact';

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        isCompact && styles.gridCardCompact,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.gridCover, isCompact && styles.gridCoverCompact, { backgroundColor: coverBg }]}>
        <Text style={[styles.gridCoverText, isCompact && { fontSize: 18 }]}>
          {book.title.substring(0, 2).toUpperCase()}
        </Text>

        {/* Top Badges */}
        <View style={styles.badgeOverlay}>
          {book.status === 'completed' ? (
            <View style={[styles.statusTag, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusTagText}>DONE</Text>
            </View>
          ) : book.currentPage > 1 ? (
            <View style={[styles.statusTag, { backgroundColor: colors.primary }]}>
              <Text style={styles.statusTagText}>p. {book.currentPage}</Text>
            </View>
          ) : (
            <View style={[styles.statusTag, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.statusTagText}>NEW</Text>
            </View>
          )}

          {book.bookmarks.length > 0 && (
            <View style={[styles.iconTag, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Bookmark size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Bottom Progress Bar */}
        <View style={styles.coverProgressTrack}>
          <View
            style={[
              styles.coverProgressFill,
              { width: `${progressPercent}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      <View style={styles.gridInfo}>
        <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {book.title}
        </Text>
        {!isCompact && (
          <Text style={[styles.gridAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {book.author}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gridCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 14,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gridCardCompact: {
    width: '31%',
    marginBottom: 10,
  },
  gridCover: {
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridCoverCompact: {
    height: 125,
  },
  gridCoverText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.85,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  iconTag: {
    padding: 3,
    borderRadius: 6,
  },
  coverProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  coverProgressFill: {
    height: '100%',
  },
  gridInfo: {
    padding: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  gridAuthor: {
    fontSize: 11,
    marginTop: 2,
  },
  // List View Styles
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  listCover: {
    width: 48,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeTopRight: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 2,
  },
  listDetails: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  author: {
    fontSize: 12,
    marginTop: 2,
  },
  progressRow: {
    marginTop: 6,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
    marginTop: 4,
  },
  bookmarkBadge: {
    padding: 6,
  },
});
