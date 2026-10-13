import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@expo/ui/community/slider';
import { useTheme } from '../../contexts/ThemeContext';

export interface MihonSliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
  onChange: (val: number) => void;
}

export const MihonSlider: React.FC<MihonSliderProps> = ({
  label,
  value,
  min = 0,
  max = 25,
  step = 1,
  unit = '%',
  helpText,
  onChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.outerContainer}>
      {/* Header with Title and Mihon-style Pill Badge */}
      {Boolean(label) && (
        <View style={styles.headerRow}>
          <Text style={[styles.labelTitle, { color: colors.textPrimary }]}>{label}</Text>
          <View style={[styles.valueBadge, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.valueBadgeText, { color: colors.primary }]}>
              {value}
              {unit}
            </Text>
          </View>
        </View>
      )}

      {/* Native Material 3 Jetpack Compose Slider from @expo/ui */}
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.nativeSlider}
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surfaceVariant}
          thumbTintColor={colors.primary}
          onValueChange={(val) => {
            const rounded = Math.round(val);
            onChange(rounded);
          }}
        />
      </View>

      {/* Optional Helper Text */}
      {Boolean(helpText) && (
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>{helpText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  valueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sliderWrapper: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  nativeSlider: {
    width: '100%',
    height: 40,
  },
  helpText: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 15,
  },
});
