import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useReaderSettings } from '../../contexts/ReaderContext';
import { ArrowLeft, RotateCcw } from 'lucide-react-native';
import { NativeSlider } from '../../components/common/NativeSlider';
import { ReadingMode } from '../../types';

export default function ReaderSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { settings, updateSettings, resetSettings } = useReaderSettings();

  const handleReset = () => {
    Alert.alert(
      'Reset Reader Settings',
      'Are you sure you want to restore default reader settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetSettings(),
        },
      ]
    );
  };

  const readingModes: { id: ReadingMode; label: string; desc: string }[] = [
    { id: 'long_strip', label: 'Long strip', desc: 'Continuous vertical webtoon strip' },
    { id: 'single_page_h', label: 'Paged (LTR)', desc: 'Horizontal single page slider' },
    { id: 'single_page_v', label: 'Paged (Vertical)', desc: 'Vertical single page slider' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reader Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section: Reading Mode */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Reading Mode</Text>

        <Text style={[styles.settingSubTitle, { color: colors.textSecondary }]}>
          Default reading layout when opening books
        </Text>

        <View style={styles.modeCardsContainer}>
          {readingModes.map((m) => {
            const isSelected = settings.readingMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.modeCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => updateSettings({ readingMode: m.id })}
                activeOpacity={0.7}
              >
                <View style={styles.modeCardHeader}>
                  <Text
                    style={[
                      styles.modeCardLabel,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: isSelected ? colors.primary : colors.border },
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.modeCardDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Layout & Margins */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Layout & Spacing
        </Text>

        {/* Native Side Padding Slider (Mode Specific) */}
        <View style={[styles.sliderBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <NativeSlider
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
            helpText="Adjusts side margins specifically for the active reading mode (0% - 25%)."
            onChange={(val) => {
              if (settings.readingMode === 'long_strip') {
                updateSettings({ sidePaddingLongStrip: val, sidePadding: val });
              } else if (settings.readingMode === 'single_page_v') {
                updateSettings({ sidePaddingPagedVertical: val });
              } else {
                updateSettings({ sidePaddingPagedLtr: val });
              }
            }}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Double tap to zoom</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Double tap anywhere on a page to quickly zoom in or out
            </Text>
          </View>
          <Switch
            value={settings.doubleTapToZoom}
            onValueChange={(doubleTapToZoom) => updateSettings({ doubleTapToZoom })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Navigation & System */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Navigation & System
        </Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Keep screen awake</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Prevent screen timeout while reading documents
            </Text>
          </View>
          <Switch
            value={settings.keepScreenOn}
            onValueChange={(keepScreenOn) => updateSettings({ keepScreenOn })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Incognito Reading Mode</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Pause tracking reading history and session statistics
            </Text>
          </View>
          <Switch
            value={Boolean(settings.incognitoMode)}
            onValueChange={(incognitoMode) => updateSettings({ incognitoMode })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Reset Settings Action */}
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={colors.textSecondary} />
          <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
            Reset to Default Settings
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingSubTitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  modeCardsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  modeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeCardLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modeCardDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  sliderBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  labelWrapper: {
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
    gap: 8,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
