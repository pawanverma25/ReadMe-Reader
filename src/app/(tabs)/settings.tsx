import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BookOpen,
  Database,
  Info,
  Palette,
  Shield,
  Sliders,
  Terminal,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const settingsItems = [
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Theme, date & time format',
      icon: Palette,
      route: '/settings/appearance',
    },
    {
      id: 'library',
      title: 'Library',
      subtitle: 'Categories, global update, grid layout',
      icon: BookOpen,
      route: '/category-manager',
    },
    {
      id: 'statistics',
      title: 'Statistics',
      subtitle: 'Reading duration, total books, completed entries',
      icon: Terminal,
      route: '/settings/statistics',
    },
    {
      id: 'reader',
      title: 'Reader',
      subtitle: 'Reading mode, display, navigation',
      icon: Sliders,
      route: '/settings/reader-settings',
    },
    {
      id: 'data-storage',
      title: 'Data and storage',
      subtitle: 'Manual & automatic backups, storage space',
      icon: Database,
      route: '/settings/data-storage',
    },
    {
      id: 'privacy',
      title: 'Security and privacy',
      subtitle: 'App lock, secure screen',
      icon: Shield,
    },
    {
      id: 'advanced',
      title: 'Advanced',
      subtitle: 'Dump crash logs, battery optimizations',
      icon: Terminal,
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'ReadMe Version 1.0.0',
      icon: Info,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {settingsItems.map((item) => {
          const IconComp = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <IconComp size={22} color={colors.primary} />
              </View>

              <View style={styles.itemTextContainer}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                  {item.subtitle}
                </Text>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
