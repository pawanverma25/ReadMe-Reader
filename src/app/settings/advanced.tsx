import React, { useEffect, useState } from 'react';
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
import { clearCrashLogs, exportCrashLogs, getCrashLogs } from '../../utils/logger';
import { AlertConfig, ThemedAlert } from '../../components/common/ThemedAlert';
import { ArrowLeft, Bug, Download, RefreshCw, Trash2 } from 'lucide-react-native';

export default function AdvancedSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [logsText, setLogsText] = useState<string>('Loading logs...');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const loadLogs = async () => {
    setRefreshing(true);
    const content = await getCrashLogs();
    setLogsText(content);
    setRefreshing(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportLogs = async () => {
    const res = await exportCrashLogs();
    if (!res.success && res.error) {
      setAlertConfig({
        visible: true,
        title: 'Export Error',
        message: res.error,
        type: 'error',
        confirmText: 'OK',
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
      });
    }
  };

  const handleClearLogs = async () => {
    setAlertConfig({
      visible: true,
      title: 'Clear Crash Logs',
      message: 'Are you sure you want to delete all recorded crash log entries?',
      type: 'warning',
      confirmText: 'Clear Logs',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        await clearCrashLogs();
        await loadLogs();
      },
      onCancel: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Advanced & Diagnostics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dump & Export Action Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Bug size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Crash Log Recorder</Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            ReadMe automatically records uncaught errors and PDF rendering exceptions locally. Dump or share crash logs for troubleshooting.
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleExportLogs}
              activeOpacity={0.8}
            >
              <Download size={16} color={colors.onPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Dump & Share Logs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtnSecondary, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              onPress={handleClearLogs}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={colors.danger} />
              <Text style={[styles.actionBtnText, { color: colors.danger }]}>Clear Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Logs View Terminal */}
        <View style={styles.terminalHeaderRow}>
          <Text style={[styles.terminalTitle, { color: colors.textSecondary }]}>RAW CRASH LOG BUFFER</Text>
          <TouchableOpacity onPress={loadLogs} disabled={refreshing}>
            <RefreshCw size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.terminalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={styles.terminalScroll} nestedScrollEnabled>
            <Text style={[styles.terminalText, { color: colors.textPrimary }]}>{logsText}</Text>
          </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  terminalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  terminalTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  terminalBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    height: 320,
  },
  terminalScroll: {
    flex: 1,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
