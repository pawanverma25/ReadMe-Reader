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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reader</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Reading */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>Reading</Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
            Skip chapters marked read
          </Text>
          <Switch
            value={false}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
            Skip filtered chapters
          </Text>
          <Switch
            value={true}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
            Always show chapter transition
          </Text>
          <Switch
            value={true}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Paged */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>Paged</Text>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tap zones</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Default</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Scale type</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Fit screen</Text>
          </View>
        </TouchableOpacity>

        {/* Section: Long Strip */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Long strip
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
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Crop borders</Text>
          <Switch
            value={settings.cropBorders}
            onValueChange={(cropBorders) => updateSettings({ cropBorders })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Split wide pages</Text>
          <Switch
            value={settings.splitWidePages}
            onValueChange={(splitWidePages) => updateSettings({ splitWidePages })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Double tap to zoom</Text>
          <Switch
            value={settings.doubleTapToZoom}
            onValueChange={(doubleTapToZoom) => updateSettings({ doubleTapToZoom })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Navigation */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Navigation
        </Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Volume keys</Text>
          <Switch
            value={settings.volumeKeyNavigation}
            onValueChange={(volumeKeyNavigation) => updateSettings({ volumeKeyNavigation })}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Actions */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>Actions</Text>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
            Show actions on long tap
          </Text>
          <Switch
            value={settings.showActionsOnLongTap}
            onValueChange={(showActionsOnLongTap) => updateSettings({ showActionsOnLongTap })}
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
