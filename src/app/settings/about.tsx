import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ArrowLeft,
  Code2,
  ExternalLink,
  Layers,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react-native';

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const appVersion = Constants.expoConfig?.version || '1.1.0';

  const features = [
    {
      icon: Zap,
      title: 'Zero-Heap Native Streaming',
      desc: 'PDFs stream directly via native ArrayBuffer without JVM string heap overhead.',
    },
    {
      icon: Layers,
      title: 'Page Virtualization',
      desc: 'Virtualized viewport rendering ensures smooth 60fps scrolling on documents of any size.',
    },
    {
      icon: Lock,
      title: '100% Offline & Private',
      desc: 'All books, bookmarks, and stats remain strictly on your local device storage.',
    },
    {
      icon: Sparkles,
      title: 'Material 3 Reader Controls',
      desc: 'Native Jetpack Compose sliders and fluid reader navigation controls.',
    },
  ];

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/pawanverma25/ReadMe-Reader');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>About</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logoImage}
              contentFit="cover"
            />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>ReadMe</Text>
          <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
            Modern Offline PDF & eBook Reader
          </Text>

          <View style={[styles.versionPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[styles.versionText, { color: colors.primary }]}>
              v{appVersion}
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Key Capabilities</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            const isLast = idx === features.length - 1;
            return (
              <View
                key={feat.title}
                style={[
                  styles.featureRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.featureIconBox, { backgroundColor: colors.surfaceVariant }]}>
                  <IconComp size={20} color={colors.primary} />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{feat.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{feat.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Community & Open Source */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Source & License</Text>
        <TouchableOpacity
          style={[styles.card, styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleOpenGitHub}
          activeOpacity={0.7}
        >
          <View style={[styles.featureIconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Code2 size={20} color={colors.textPrimary} />
          </View>
          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>GitHub Repository</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              Open-source project on GitHub
            </Text>
          </View>
          <ExternalLink size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ReadMe • Built for speed, privacy, and reading comfort
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
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  appTagline: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  versionPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
