import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface SummaryStatCardProps {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  unit?: string;
}

export function SummaryStatCard({ icon, label, value, unit }: SummaryStatCardProps) {
  return (
    <View style={styles.card}>
      <MaterialIcons
        name={icon}
        size={20}
        color={`${BrandColors.performanceBlue}66`}
        style={styles.icon}
      />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? (
          <Text style={styles.unit} numberOfLines={1}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
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
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: BrandColors.slate400,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: BrandColors.text,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.slate400,
    marginLeft: 2,
  },
});
