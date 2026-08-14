import React from 'react';
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
import { useReaderSettings } from '../../contexts/ReaderContext';
import { ArrowLeft } from 'lucide-react-native';

export default function ReaderSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useReaderSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reader Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Reading Mode */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Reading Mode</Text>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Default reading mode</Text>
            <Text style={[styles.settingSub, { color: colors.primary, fontWeight: '700' }]}>
              {settings.readingMode === 'long_strip' ? 'Long strip (Continuous)' : 'Single Page'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Section: Long Strip Options */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Long strip layout
        </Text>

        {/* Side Padding Slider Bar */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Side padding</Text>
            <Text style={[styles.settingSub, { color: colors.primary, fontWeight: '700' }]}>
              {settings.sidePadding}%
            </Text>
          </View>
          <View style={[styles.sliderTrack, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.sliderFill,
                { width: `${(settings.sidePadding / 25) * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <View style={styles.sliderButtonsRow}>
            {[0, 5, 10, 15, 20, 25].map((pad) => (
              <TouchableOpacity
                key={pad}
                style={[
                  styles.padChip,
                  { backgroundColor: colors.surface },
                  settings.sidePadding === pad && { backgroundColor: colors.primary },
                ]}
                onPress={() => updateSettings({ sidePadding: pad })}
              >
                <Text
                  style={[
                    styles.padChipText,
                    { color: colors.textSecondary },
                    settings.sidePadding === pad && { color: colors.onPrimary, fontWeight: '700' },
                  ]}
                >
                  {pad}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Crop borders</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Remove blank page margins</Text>
          </View>
          <Switch
            value={settings.cropBorders}
            onValueChange={(cropBorders) => updateSettings({ cropBorders })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Double tap to zoom</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Quick zoom in/out gesture</Text>
          </View>
          <Switch
            value={settings.doubleTapToZoom}
            onValueChange={(doubleTapToZoom) => updateSettings({ doubleTapToZoom })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Display & Gestures */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Display & Navigation
        </Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Volume keys navigation</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              Use hardware volume buttons to flip pages
            </Text>
          </View>
          <Switch
            value={settings.volumeKeyNavigation}
            onValueChange={(volumeKeyNavigation) => updateSettings({ volumeKeyNavigation })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Keep screen awake</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Prevent screen timeout while reading</Text>
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
              Pause saving reading history & timestamps
            </Text>
          </View>
          <Switch
            value={Boolean(settings.incognitoMode)}
            onValueChange={(incognitoMode) => updateSettings({ incognitoMode })}
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
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
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
  sliderContainer: {
    marginVertical: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sliderFill: {
    height: '100%',
  },
  sliderButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  padChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  padChipText: {
    fontSize: 11,
  },
});
