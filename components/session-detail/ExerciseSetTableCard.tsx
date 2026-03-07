import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { WorkoutSet } from '@/src/domain';

import { PRBadge, type PRBadgeVariant } from './PRBadge';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface ExerciseOptionalDetails {
  machineName?: string | null;
  seatHeight?: string | null;
  benchAngleDeg?: number | null;
  grip?: string | null;
  notes?: string | null;
}

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
  /** Optional exercise details like machine name, seat height, etc. */
  optionalDetails?: ExerciseOptionalDetails;
}

type DetailItem = {
  icon: MaterialIconName;
  label: string;
  value: string;
};

function getDetailItems(details?: ExerciseOptionalDetails): DetailItem[] {
  if (!details) return [];
  const items: DetailItem[] = [];

  if (details.machineName) {
    items.push({ icon: 'precision-manufacturing', label: 'Machine', value: details.machineName });
  }
  if (details.seatHeight) {
    items.push({ icon: 'height', label: 'Seat', value: details.seatHeight });
  }
  if (details.benchAngleDeg !== null && details.benchAngleDeg !== undefined) {
    items.push({ icon: 'straighten', label: 'Angle', value: `${details.benchAngleDeg}°` });
  }
  if (details.grip) {
    items.push({ icon: 'pan-tool', label: 'Grip', value: details.grip });
  }

  return items;
}

export function ExerciseSetTableCard({
  exerciseName,
  sets,
  weightUnit,
  prSetIndex = -1,
  prOnWeight = true,
  prBadgeVariant = 'trending_up',
  optionalDetails,
}: ExerciseSetTableCardProps) {
  const detailItems = getDetailItems(optionalDetails);
  const hasDetails = detailItems.length > 0;
  const hasNotes = optionalDetails?.notes;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{exerciseName}</Text>
        <MaterialIcons name="fitness-center" size={22} color={BrandColors.slate400} />
      </View>

      {hasDetails && (
        <View style={styles.detailsContainer}>
          {detailItems.map((item, index) => (
            <View key={index} style={styles.detailItem}>
              <MaterialIcons name={item.icon} size={14} color={BrandColors.performanceAccent} />
              <Text style={styles.detailLabel}>{item.label}:</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      )}

      {hasNotes && (
        <View style={styles.notesContainer}>
          <MaterialIcons name="notes" size={14} color={BrandColors.slate400} />
          <Text style={styles.notesText}>{optionalDetails.notes}</Text>
        </View>
      )}

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
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
    backgroundColor: 'rgba(255,107,53,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.backgroundLight,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: BrandColors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.text,
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
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF8F3',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.backgroundLight,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.slate400,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
