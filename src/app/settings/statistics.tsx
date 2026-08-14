import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react-native';

export default function StatisticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books } = useLibrary();

  const totalReadMins = books.reduce((acc, b) => acc + (b.readingTimeMinutes || 0), 0);
  const hours = Math.floor(totalReadMins / 60);
  const mins = totalReadMins % 60;
  const readDurationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m 00s`;

  const completedCount = books.filter((b) => b.status === 'completed').length;
  const startedCount = books.filter((b) => b.currentPage > 1).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Statistics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Overview */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Overview</Text>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statGridRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{books.length}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>In library</Text>
              <BookOpen size={18} color={colors.primary} style={{ marginTop: 6 }} />
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{readDurationText}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Read duration</Text>
              <Clock size={18} color={colors.primary} style={{ marginTop: 6 }} />
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{completedCount}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Completed entries</Text>
              <CheckCircle size={18} color={colors.primary} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>

        {/* Section: Entries */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>Entries</Text>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statGridRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{startedCount}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Started</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{books.length}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Local PDF</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  statCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  statGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 11,
    marginTop: 3,
  },
});
