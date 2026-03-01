import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

export interface SessionStatsOverviewCardProps {
  totalVolume: number;
  totalVolumeUnit: string;
  totalSets: number;
}

export function SessionStatsOverviewCard({
  totalVolume,
  totalVolumeUnit,
  totalSets,
}: SessionStatsOverviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <Text style={styles.label}>Total Volume</Text>
        <Text style={styles.value}>
          {totalVolume.toLocaleString()}{' '}
          <Text style={styles.unit}>{totalVolumeUnit}</Text>
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.column}>
        <Text style={styles.label}>Total Sets</Text>
        <Text style={styles.value}>{totalSets}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    color: BrandColors.performanceBlue,
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.performanceBlue,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: BrandColors.border,
  },
});
