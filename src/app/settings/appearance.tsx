import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../../contexts/ThemeContext';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { ThemePreset } from '../../types';
import { ArrowLeft, Check, X } from 'lucide-react-native';

export default function AppearanceScreen() {
  const { colors, themeMode, themePreset, pureBlackDarkMode, setThemeMode, setThemePreset, setPureBlackDarkMode } = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useReaderSettings();

  const [relativeTimestamps, setRelativeTimestamps] = useState(true);
  const [showTabletModal, setShowTabletModal] = useState(false);

  const tabletMode = settings.tabletUiMode || 'auto';

  const themePresetsConfig: { id: ThemePreset; name: string; primaryColor: string; bgNav: string }[] = [
    { id: 'default', name: 'Default', primaryColor: '#EC407A', bgNav: '#241E2B' },
    { id: 'dynamic', name: 'Dynamic', primaryColor: '#2DD4BF', bgNav: '#1D2F2F' },
    { id: 'catppuccin', name: 'Catppuccin', primaryColor: '#C6A0F6', bgNav: '#313244' },
    { id: 'green_apple', name: 'Green Apple', primaryColor: '#4ADE80', bgNav: '#1E2F26' },
    { id: 'nord', name: 'Nord', primaryColor: '#88C0D0', bgNav: '#2E3440' },
    { id: 'tokyo_night', name: 'Tokyo Night', primaryColor: '#7AA2F7', bgNav: '#24283B' },
    { id: 'dracula', name: 'Dracula', primaryColor: '#FF79C6', bgNav: '#343746' },
    { id: 'solarized', name: 'Solarized', primaryColor: '#B58900', bgNav: '#073642' },
    { id: 'sepia', name: 'Sepia Warm', primaryColor: '#D97706', bgNav: '#292524' },
  ];

  const handleSelectTabletMode = async (mode: 'auto' | 'always' | 'landscape' | 'never') => {
    updateSettings({ tabletUiMode: mode });
    setShowTabletModal(false);

    try {
      if (mode === 'landscape') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else if (mode === 'always') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
      } else if (mode === 'never') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        await ScreenOrientation.unlockAsync();
      }
    } catch (e) {
      console.error('ScreenOrientation lock error:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Pitch black backgrounds for OLED screens
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

        {/* Tablet UI / Landscape Orientation Selector (Matching Screenshot #5) */}
        <TouchableOpacity
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => setShowTabletModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tablet UI & Landscape</Text>
            <Text style={[styles.settingSub, { color: colors.primary, fontWeight: '600' }]}>
              {tabletMode.charAt(0).toUpperCase() + tabletMode.slice(1)}
            </Text>
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
      </ScrollView>

      {/* Tablet UI / Landscape Dialog Modal (Matching Screenshot #5) */}
      <Modal visible={showTabletModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Tablet UI & Orientation</Text>

            {[
              { id: 'auto', label: 'Auto' },
              { id: 'always', label: 'Always' },
              { id: 'landscape', label: 'Landscape' },
              { id: 'never', label: 'Never' },
            ].map((opt) => {
              const isSelected = tabletMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.radioRow,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelectTabletMode(opt.id as any)}
                >
                  <View style={[styles.radioCircle, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.radioText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowTabletModal(false)}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Cancel</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 15,
  },
  cancelModalBtn: {
    alignSelf: 'flex-end',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
