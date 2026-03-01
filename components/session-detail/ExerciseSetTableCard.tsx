import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { WorkoutSet } from '@/src/domain';

import { PRBadge, type PRBadgeVariant } from './PRBadge';

export interface ExerciseSetTableCardProps {
  exerciseName: string;
  sets: WorkoutSet[];
  weightUnit: string;
  /** Which set index (0-based) has a PR for this exercise; -1 if none */
  prSetIndex?: number;
  /** Show PR badge on weight cell (true) or reps cell (false). Default true. */
  prOnWeight?: boolean;
  /** Badge icon: star (reps PR) or trending_up (weight PR). Default trending_up. */
  prBadgeVariant?: PRBadgeVariant;
}

export function ExerciseSetTableCard({
  exerciseName,
  sets,
  weightUnit,
  prSetIndex = -1,
  prOnWeight = true,
  prBadgeVariant = 'trending_up',
}: ExerciseSetTableCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        <MaterialIcons name="fitness-center" size={22} color={BrandColors.slate400} />
      </View>
      <View style={styles.tableWrap}>
        <View style={styles.tableHeader}>
          <Text style={styles.th}>Set #</Text>
          <Text style={styles.th}>Weight ({weightUnit})</Text>
          <Text style={[styles.th, styles.thRight]}>Reps</Text>
        </View>
        {sets.map((set, index) => (
          <View key={set.id} style={styles.row}>
            <Text style={styles.setNum}>{index + 1}</Text>
            <View style={styles.cellWeight}>
              <Text style={styles.cellValue}>{set.weight}</Text>
              {prSetIndex === index && prOnWeight && <PRBadge variant={prBadgeVariant} />}
            </View>
            <View style={styles.cellReps}>
              <Text style={styles.cellValue}>{set.reps}</Text>
              {prSetIndex === index && !prOnWeight && <PRBadge variant={prBadgeVariant} />}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    overflow: 'hidden',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.backgroundLight,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.performanceBlue,
  },
  tableWrap: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.border,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: BrandColors.slate400,
    width: 64,
  },
  thRight: {
    textAlign: 'right',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.backgroundLight,
  },
  setNum: {
    width: 64,
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.slate400,
  },
  cellWeight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellReps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.text,
  },
});
