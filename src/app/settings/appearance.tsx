import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemePreset } from '../../types';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function AppearanceScreen() {
  const { colors, themeMode, themePreset, pureBlackDarkMode, setThemeMode, setThemePreset, setPureBlackDarkMode } = useTheme();
  const router = useRouter();

  const [relativeTimestamps, setRelativeTimestamps] = useState(true);
  const [renderImagesInDesc, setRenderImagesInDesc] = useState(true);

  const themePresetsConfig: { id: ThemePreset; name: string; primaryColor: string; bgNav: string }[] = [
    { id: 'default', name: 'Default', primaryColor: '#EC407A', bgNav: '#241E2B' },
    { id: 'dynamic', name: 'Dynamic', primaryColor: '#2DD4BF', bgNav: '#1D2F2F' },
    { id: 'catppuccin', name: 'Catppuccin', primaryColor: '#C6A0F6', bgNav: '#313244' },
    { id: 'green_apple', name: 'Green Apple', primaryColor: '#4ADE80', bgNav: '#1E2F26' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Theme */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Theme</Text>

        {/* System / Light / Dark Segmented Pill */}
        <View style={[styles.segmentedContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {(['system', 'light', 'dark'] as const).map((mode) => {
            const isSelected = themeMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segmentItem,
                  isSelected && [styles.segmentItemActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setThemeMode(mode)}
                activeOpacity={0.8}
              >
                {isSelected && <Check size={14} color={colors.onPrimary} style={{ marginRight: 4 }} />}
                <Text
                  style={[
                    styles.segmentText,
                    { color: colors.textSecondary },
                    isSelected && { color: colors.onPrimary, fontWeight: '700' },
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme Preset Cards Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
          {themePresetsConfig.map((p) => {
            const isSelected = themePreset === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.presetCard,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setThemePreset(p.id)}
                activeOpacity={0.8}
              >
                {/* Mock phone preview */}
                <View style={[styles.phoneMockup, { backgroundColor: colors.background }]}>
                  <View style={[styles.mockTopBar, { backgroundColor: p.bgNav }]} />
                  <View style={styles.mockContent}>
                    <View style={[styles.mockCardItem, { backgroundColor: p.primaryColor }]} />
                    <View style={[styles.mockCardItem, { backgroundColor: p.bgNav }]} />
                  </View>
                  <View style={[styles.mockBottomNav, { backgroundColor: p.bgNav }]}>
                    <View style={[styles.mockDot, { backgroundColor: p.primaryColor }]} />
                  </View>
                </View>
                <Text
                  style={[
                    styles.presetName,
                    { color: colors.textPrimary },
                    isSelected && { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pure Black Dark Mode Toggle */}
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              Pure black dark mode
            </Text>
          </View>
          <Switch
            value={pureBlackDarkMode}
            onValueChange={setPureBlackDarkMode}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Display */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Display
        </Text>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>App language</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Default (System)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tablet UI</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Auto</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Date format</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Default ({new Date().toLocaleDateString()})
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              Relative timestamps
            </Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              "Today" instead of "{new Date().toLocaleDateString()}"
            </Text>
          </View>
          <Switch
            value={relativeTimestamps}
            onValueChange={setRelativeTimestamps}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              Render images in manga descriptions
            </Text>
          </View>
          <Switch
            value={renderImagesInDesc}
            onValueChange={setRenderImagesInDesc}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
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
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 3,
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  segmentItemActive: {
    borderRadius: 20,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingVertical: 4,
  },
  presetCard: {
    width: 105,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  phoneMockup: {
    width: 85,
    height: 125,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  mockTopBar: {
    height: 24,
    width: '100%',
  },
  mockContent: {
    flex: 1,
    padding: 6,
    gap: 6,
  },
  mockCardItem: {
    height: 28,
    borderRadius: 6,
  },
  mockBottomNav: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  presetName: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
