import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { Clock, Play, BookOpenCheck } from 'lucide-react-native';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books } = useLibrary();

  // Filter & sort books that have reading activity
  const historyBooks = [...books]
    .filter((b) => b.currentPage > 1 || b.status === 'completed')
    .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime());

  const formatRelativeTime = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(isoDate).toLocaleDateString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Reading History</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {historyBooks.length} active read sessions
        </Text>
      </View>

      {historyBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={56} color={colors.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Reading History</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Books you start reading will appear here with timestamps, progress tracking, and quick resume.
          </Text>
          <TouchableOpacity
            style={[styles.startReadingBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={[styles.btnText, { color: colors.onPrimary }]}>Open Library</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={historyBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => {
            const progress = Math.min(
              100,
              Math.round(((item.currentPage || 1) / (item.totalPages || 1)) * 100)
            );
            const coverBg = item.coverColor || colors.primary;

            return (
              <View
                style={[
                  styles.historyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.coverThumb, { backgroundColor: coverBg }]}>
                  <Text style={styles.coverText}>{item.title.substring(0, 2).toUpperCase()}</Text>
                </View>

                <View style={styles.details}>
                  <View style={styles.topInfoRow}>
                    <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.timeAgo, { color: colors.primary }]}>
                      {formatRelativeTime(item.lastReadAt)}
                    </Text>
                  </View>

                  <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.author}
                  </Text>

                  <View style={styles.progressSection}>
                    <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${progress}%`, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    <View style={styles.statsRow}>
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        Page {item.currentPage} of {item.totalPages} ({progress}%)
                      </Text>
                      {item.readingTimeMinutes > 0 && (
                        <Text style={[styles.statText, { color: colors.textSecondary }]}>
                          ⏱ {item.readingTimeMinutes} mins read
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.resumeBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={() => router.push(`/reader/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Play size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
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
  listPadding: {
    padding: 14,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  coverThumb: {
    width: 46,
    height: 62,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  timeAgo: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  author: {
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 8,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statText: {
    fontSize: 10,
  },
  resumeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
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
  startReadingBtn: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
