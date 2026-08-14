import React, { useState } from 'react';
import {
  Alert,
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
import { useLibrary } from '../../contexts/LibraryContext';
import {
  exportBackupToFile,
  importBackupFromFile,
} from '../../utils/storage';
import { ArrowLeft, HelpCircle, Info } from 'lucide-react-native';

export default function DataStorageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { reloadAllData } = useLibrary();

  const [clearOnLaunch, setClearOnLaunch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportBackup = async () => {
    try {
      setIsProcessing(true);
      const res = await exportBackupToFile();
      if (res.success) {
        Alert.alert('Backup Created', 'Your ReadMe backup file (.json) was generated and exported successfully!');
      } else {
        Alert.alert('Export Failed', res.error || 'Failed to export backup.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create backup.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setIsProcessing(true);
      const res = await importBackupFromFile();
      if (res.success && res.data) {
        await reloadAllData();
        Alert.alert(
          'Backup Restored!',
          `Successfully restored ${res.data.books.length} books and ${res.data.categories.length} library categories onto this device!`
        );
      } else if (res.error && res.error !== 'Import cancelled') {
        Alert.alert('Import Failed', res.error);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to import backup file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Data and storage</Text>
        <HelpCircle size={22} color={colors.textSecondary} style={{ marginLeft: 'auto', marginRight: 8 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Storage Location */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Storage location</Text>
          <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
            /storage/emulated/0/ReadMe
          </Text>
        </View>

        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant }]}>
          <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
            Used for automatic backups, PDF downloads, and local source libraries.
          </Text>
        </View>

        {/* Section: Backup and Restore */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Backup and restore
        </Text>

        {/* Create Backup / Restore Backup Pill Button Pair */}
        <View style={[styles.backupPillContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.backupPillBtn, { borderRightColor: colors.border }]}
            onPress={handleExportBackup}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={[styles.backupPillText, { color: colors.textPrimary }]}>Create backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backupPillBtn}
            onPress={handleImportBackup}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={[styles.backupPillText, { color: colors.textPrimary }]}>Restore backup</Text>
          </TouchableOpacity>
        </View>

        {/* Frequency */}
        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              Automatic backup frequency
            </Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Every 12 hours</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant, marginTop: 12 }]}>
          <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
              You should keep copies of backups in other places as well. Backups contain sensitive data including any stored preferences; be careful if sharing.
            </Text>
            <Text style={[styles.lastBackupText, { color: colors.primary }]}>
              Last automatically backed up: 59 minutes ago
            </Text>
          </View>
        </View>

        {/* Section: Storage Usage */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 28 }]}>
          Storage usage
        </Text>

        <View style={styles.storageUsageContainer}>
          <Text style={[styles.storagePath, { color: colors.textPrimary }]}>
            /storage/emulated/0
          </Text>

          {/* Mihon Thick Pink Storage Bar */}
          <View style={[styles.storageTrack, { backgroundColor: colors.surfaceVariant }]}>
            <View style={[styles.storageFill, { backgroundColor: colors.primary, width: '78%' }]} />
          </View>

          <Text style={[styles.storageStats, { color: colors.textSecondary }]}>
            Available: 24.21 GB / Total: 117 GB
          </Text>
        </View>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Clear chapter cache</Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Used: 57.34 MB</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              Clear chapter cache on app launch
            </Text>
          </View>
          <Switch
            value={clearOnLaunch}
            onValueChange={setClearOnLaunch}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Section: Export */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 24 }]}>
          Export
        </Text>

        <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Library List</Text>
          </View>
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
    paddingBottom: 40,
  },
  sectionMargin: {
    marginBottom: 8,
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
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 16,
  },
  lastBackupText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  backupPillContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  backupPillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRightWidth: 0.5,
  },
  backupPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  storageUsageContainer: {
    marginVertical: 10,
  },
  storagePath: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  storageTrack: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageFill: {
    height: '100%',
    borderRadius: 6,
  },
  storageStats: {
    fontSize: 12,
  },
});
