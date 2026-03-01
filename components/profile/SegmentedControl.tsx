import { Pressable, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export type SegmentedOption<T> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
}: SegmentedControlProps<T>) {
  const trackBg = useThemeColor(
    { light: '#F1F5F9', dark: BrandColors.slate800 },
    'background'
  );
  const activeBg = useThemeColor(
    { light: BrandColors.white, dark: BrandColors.slate700 },
    'card'
  );

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.option,
              isActive && [styles.optionActive, { backgroundColor: activeBg }],
            ]}
            onPress={() => onValueChange(opt.value)}
          >
            {opt.icon}
            <ThemedText
              style={[
                styles.optionLabel,
                isActive ? styles.optionLabelActive : styles.optionLabelInactive,
              ]}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: BrandColors.primary,
  },
  optionLabelInactive: {
    color: BrandColors.slate,
  },
});

