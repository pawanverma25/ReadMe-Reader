import React, { useState } from 'react';
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
import { useLibrary } from '../../contexts/LibraryContext';
import { AlertConfig, ThemedAlert } from '../../components/common/ThemedAlert';
import {
  exportBackupToFile,
  importBackupFromFile,
} from '../../utils/storage';
import { ArrowLeft, Database, Download, HardDrive, Info, Upload } from 'lucide-react-native';

export default function DataStorageScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { books, reloadAllData } = useLibrary();

  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (config: Omit<AlertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Calculate actual storage occupied by imported books
  const totalSizeBytes = books.reduce((acc, b) => acc + (b.fileSize || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const handleExportBackup = async () => {
    try {
      setIsProcessing(true);
      const res = await exportBackupToFile();
      if (res.success) {
        showAlert({
          title: 'Backup Exported',
          message: 'Your ReadMe library backup file (.json) was generated and exported successfully!',
          type: 'success',
          confirmText: 'OK',
          onConfirm: hideAlert,
        });
      } else {
        showAlert({
          title: 'Export Failed',
          message: res.error || 'Failed to export backup payload.',
          type: 'error',
          confirmText: 'OK',
          onConfirm: hideAlert,
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Export Error',
        message: e?.message || 'Failed to create backup.',
        type: 'error',
        confirmText: 'OK',
        onConfirm: hideAlert,
      });
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
        showAlert({
          title: 'Backup Restored!',
          message: `Successfully restored ${res.data.books.length} books and ${res.data.categories.length} categories onto this device!`,
          type: 'success',
          confirmText: 'Great',
          onConfirm: hideAlert,
        });
      } else if (res.error && res.error !== 'Import cancelled') {
        showAlert({
          title: 'Import Failed',
          message: res.error,
          type: 'error',
          confirmText: 'OK',
          onConfirm: hideAlert,
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Import Error',
        message: e?.message || 'Failed to import backup file.',
        type: 'error',
        confirmText: 'OK',
        onConfirm: hideAlert,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Data & Storage</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Real Library Storage Usage Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <HardDrive size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Local Library Storage</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{books.length}</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Imported PDFs</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{totalSizeMB} MB</Text>
              <Text style={[styles.statSub, { color: colors.textSecondary }]}>Calculated disk size</Text>
            </View>
          </View>
        </View>

        {/* Section: Backup and Restore */}
        <Text style={[styles.sectionLabel, { color: colors.primary, marginTop: 12 }]}>
          Backup & Data Transfer
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Export your entire library metadata, bookmarks, categories, and reading history to a single backup file, or restore data onto a new device.
          </Text>

          {/* Export JSON Backup Button */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleExportBackup}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Download size={18} color={colors.onPrimary} />
            <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Export Library Backup (.json)</Text>
          </TouchableOpacity>

          {/* Import JSON Backup Button */}
          <TouchableOpacity
            style={[styles.actionBtnSecondary, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
            onPress={handleImportBackup}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Upload size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Import Library Backup (.json)</Text>
          </TouchableOpacity>
        </View>

        {/* Informational Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
          <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
            ReadMe backups store your reading positions, bookmarks, custom categories, and library metadata securely on your device.
          </Text>
        </View>
      </ScrollView>

      <ThemedAlert {...alertConfig} />
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
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 12,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
