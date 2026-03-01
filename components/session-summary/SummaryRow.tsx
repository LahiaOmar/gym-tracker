import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface SummaryRowProps {
  leftIcon: ComponentProps<typeof MaterialIcons>['name'];
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  rightValueAccent?: boolean;
}

export function SummaryRow({
  leftIcon,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  rightValueAccent = false,
}: SummaryRowProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <MaterialIcons
            name={leftIcon}
            size={24}
            color={BrandColors.performanceBlue}
          />
        </View>
        <View>
          <Text style={styles.label}>{leftLabel}</Text>
          <Text style={styles.value}>{leftValue}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.label}>{rightLabel}</Text>
        <Text style={[styles.value, rightValueAccent && styles.valueAccent]}>
          {rightValue}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BrandColors.performanceBlue}0D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: BrandColors.slate400,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.text,
    marginTop: 2,
  },
  valueAccent: {
    color: BrandColors.performanceAccent,
  },
});
