import { ThemePreset } from '../types';

export interface ColorScheme {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  danger: string;
  success: string;
  readerBg: {
    oled: string;
    dark: string;
    sepia: string;
    light: string;
  };
}

export const MihonThemes: Record<ThemePreset, { dark: ColorScheme; light: ColorScheme }> = {
  default: {
    dark: {
      primary: '#EC407A',
      primaryContainer: '#4A1428',
      onPrimary: '#FFFFFF',
      background: '#16131B',
      surface: '#201A27',
      surfaceVariant: '#2B2335',
      card: '#33293F',
      textPrimary: '#F6F2FA',
      textSecondary: '#ABA3B6',
      border: '#3E324C',
      accent: '#EC407A',
      danger: '#FF5252',
      success: '#4CAF50',
      readerBg: {
        oled: '#000000',
        dark: '#16131B',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
    light: {
      primary: '#D81B60',
      primaryContainer: '#FCE4EC',
      onPrimary: '#FFFFFF',
      background: '#FFF8FA',
      surface: '#F7EDF0',
      surfaceVariant: '#EFE1E6',
      card: '#FFFFFF',
      textPrimary: '#22191C',
      textSecondary: '#6B585F',
      border: '#E2D1D7',
      accent: '#D81B60',
      danger: '#D32F2F',
      success: '#388E3C',
      readerBg: {
        oled: '#000000',
        dark: '#16131B',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
  },
  dynamic: {
    dark: {
      primary: '#2DD4BF',
      primaryContainer: '#0F3832',
      onPrimary: '#000000',
      background: '#0F1717',
      surface: '#152222',
      surfaceVariant: '#1D2F2F',
      card: '#243A3A',
      textPrimary: '#F0FDFA',
      textSecondary: '#99F6E4',
      border: '#2E4C4C',
      accent: '#2DD4BF',
      danger: '#F87171',
      success: '#34D399',
      readerBg: {
        oled: '#000000',
        dark: '#0F1717',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
    light: {
      primary: '#0D9488',
      primaryContainer: '#CCFBF1',
      onPrimary: '#FFFFFF',
      background: '#F0FDFA',
      surface: '#E6FFFA',
      surfaceVariant: '#CCFBF1',
      card: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      border: '#99F6E4',
      accent: '#0D9488',
      danger: '#EF4444',
      success: '#10B981',
      readerBg: {
        oled: '#000000',
        dark: '#0F1717',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
  },
  catppuccin: {
    dark: {
      primary: '#C6A0F6',
      primaryContainer: '#362A4E',
      onPrimary: '#1E1E2E',
      background: '#181825',
      surface: '#1E1E2E',
      surfaceVariant: '#313244',
      card: '#45475A',
      textPrimary: '#CDD6F4',
      textSecondary: '#A6ADC8',
      border: '#585B70',
      accent: '#C6A0F6',
      danger: '#F38BA8',
      success: '#A6E3A1',
      readerBg: {
        oled: '#000000',
        dark: '#181825',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
    light: {
      primary: '#8839EF',
      primaryContainer: '#E8DDFF',
      onPrimary: '#FFFFFF',
      background: '#EFF1F5',
      surface: '#E6E9EF',
      surfaceVariant: '#DCE0E8',
      card: '#FFFFFF',
      textPrimary: '#4C4F69',
      textSecondary: '#6C6F85',
      border: '#BCC0CC',
      accent: '#8839EF',
      danger: '#D20F39',
      success: '#40A02B',
      readerBg: {
        oled: '#000000',
        dark: '#181825',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
  },
  green_apple: {
    dark: {
      primary: '#4ADE80',
      primaryContainer: '#143820',
      onPrimary: '#000000',
      background: '#0E1410',
      surface: '#15201A',
      surfaceVariant: '#1E2F26',
      card: '#263B30',
      textPrimary: '#F0FDF4',
      textSecondary: '#86EFAC',
      border: '#2E4C3B',
      accent: '#4ADE80',
      danger: '#F87171',
      success: '#4ADE80',
      readerBg: {
        oled: '#000000',
        dark: '#0E1410',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
    light: {
      primary: '#16A34A',
      primaryContainer: '#DCFCE7',
      onPrimary: '#FFFFFF',
      background: '#F0FDF4',
      surface: '#DCFCE7',
      surfaceVariant: '#BBF7D0',
      card: '#FFFFFF',
      textPrimary: '#14532D',
      textSecondary: '#15803D',
      border: '#86EFAC',
      accent: '#16A34A',
      danger: '#DC2626',
      success: '#16A34A',
      readerBg: {
        oled: '#000000',
        dark: '#0E1410',
        sepia: '#F4ECD8',
        light: '#FFFFFF',
      },
    },
  },
};
