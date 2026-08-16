import React from 'react';
import {
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
import { useSecurity } from '../../contexts/SecurityContext';
import { ArrowLeft, Fingerprint, Lock, ShieldAlert, ShieldCheck } from 'lucide-react-native';

export default function SecuritySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    isAppLockEnabled,
    isSecureScreenEnabled,
    toggleAppLock,
    toggleSecureScreen,
  } = useSecurity();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Security & Privacy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={[styles.banner, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Fingerprint size={24} color={colors.primary} />
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
              Native System Authentication
            </Text>
            <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
              ReadMe integrates directly with Android's system security API. Unlocking uses your device's Fingerprint, Face ID, or PIN/Pattern.
            </Text>
          </View>
        </View>

        {/* Settings Options List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* App Lock Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.iconBox}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>App Lock</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Require system Biometric or Device PIN when opening or resuming ReadMe
              </Text>
            </View>
            <Switch
              value={isAppLockEnabled}
              onValueChange={(val) => {
                toggleAppLock(val);
              }}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Secure Screen Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.iconBox}>
              <ShieldAlert size={20} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Secure Screen (FLAG_SECURE)</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Block screenshots and hide app window content in Android Recent Apps switcher
              </Text>
            </View>
            <Switch
              value={isSecureScreenEnabled}
              onValueChange={(val) => toggleSecureScreen(val)}
              trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Security Status Badge */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {isAppLockEnabled
              ? 'App Lock Status: Active (Protected by Android System Security)'
              : 'App Lock Status: Disabled (Tap toggle above to enable System Lock)'}
          </Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 36,
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
