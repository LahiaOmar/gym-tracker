import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { WorkoutSet } from '@/src/domain';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const ACCENT = BrandColors.performanceAccent;

export interface SetRowData {
  set: WorkoutSet;
  index: number;
  isCurrent: boolean;
}

interface ExerciseCardProps {
  title: string;
  subtitle?: string;
  imageUri?: string | null;
  sets: SetRowData[];
  onMorePress?: () => void;
  onWeightChange: (setId: string, value: number) => void;
  onRepsChange: (setId: string, value: number) => void;
  onAddSet: () => void;
  hasSets: boolean;
  emptyLabel?: string;
  emptyButtonLabel?: string;
  emptyButtonIcon?: keyof typeof MaterialIcons.glyphMap;
  addSetButtonLabel?: string;
  addSetButtonIcon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
}

export function ExerciseCard({
  title,
  subtitle,
  imageUri,
  sets,
  onMorePress,
  onWeightChange,
  onRepsChange,
  onAddSet,
  hasSets,
  emptyLabel = 'No sets recorded yet',
  emptyButtonLabel = 'Start Exercise',
  emptyButtonIcon = 'play-circle',
  addSetButtonLabel = 'Add Set',
  addSetButtonIcon = 'add-circle',
  disabled = false,
}: ExerciseCardProps) {
  const isEmpty = !hasSets;

  return (
    <View style={[styles.card, disabled && styles.cardDisabled]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.imageWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="fitness-center" size={24} color={PERFORMANCE_BLUE} />
              </View>
            )}
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <Pressable
          onPress={onMorePress}
          style={({ pressed }) => [styles.moreBtn, pressed && styles.moreBtnPressed]}
          hitSlop={8}
        >
          <MaterialIcons name="more-vert" size={24} color="#94A3B8" />
        </Pressable>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyLabel}</Text>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={onAddSet}
          >
            <MaterialIcons name={emptyButtonIcon} size={20} color={ACCENT} />
            <Text style={styles.actionBtnText}>{emptyButtonLabel}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.gridHeader}>
            <Text style={[styles.gridHeaderCell, styles.setCol]}>Set</Text>
            <Text style={[styles.gridHeaderCell, styles.weightCol]}>Weight (kg)</Text>
            <Text style={[styles.gridHeaderCell, styles.repsCol]}>Reps</Text>
            <Text style={[styles.gridHeaderCell, styles.doneCol]}>Done</Text>
          </View>
          <View style={styles.setsList}>
            {sets.map(({ set, index, isCurrent }) => (
              <SetRow
                key={set.id}
                setNumber={index + 1}
                weight={set.weight}
                reps={set.reps}
                isCurrent={isCurrent}
                onWeightChange={(v) => onWeightChange(set.id, v)}
                onRepsChange={(v) => onRepsChange(set.id, v)}
              />
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnBorder, pressed && styles.actionBtnPressed]}
            onPress={onAddSet}
          >
            <MaterialIcons name={addSetButtonIcon} size={20} color={ACCENT} />
            <Text style={styles.actionBtnText}>{addSetButtonLabel}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  isCurrent: boolean;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
}

function SetRow({
  setNumber,
  weight,
  reps,
  isCurrent,
  onWeightChange,
  onRepsChange,
}: SetRowProps) {
  return (
    <View style={[styles.setRow, isCurrent && styles.setRowCurrent]}>
      <View style={[styles.setCol, styles.setNumWrap]}>
        <Text style={[styles.setNum, isCurrent && styles.setNumCurrent]}>{setNumber}</Text>
      </View>
      <View style={styles.weightCol}>
        <TextInput
          style={[styles.input, isCurrent ? styles.inputCurrent : styles.inputReadonly]}
          value={weight ? String(weight) : ''}
          onChangeText={(t) => {
            const n = t ? parseFloat(t) : 0;
            if (!Number.isNaN(n)) onWeightChange(n);
          }}
          placeholder="80"
          placeholderTextColor="#94A3B8"
          keyboardType="decimal-pad"
          editable={isCurrent}
          selectTextOnFocus={isCurrent}
        />
      </View>
      <View style={styles.repsCol}>
        <TextInput
          style={[styles.input, isCurrent ? styles.inputCurrent : styles.inputReadonly]}
          value={reps ? String(reps) : ''}
          onChangeText={(t) => {
            const n = t ? parseInt(t, 10) : 0;
            if (!Number.isNaN(n)) onRepsChange(n);
          }}
          placeholder="10"
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          editable={isCurrent}
          selectTextOnFocus={isCurrent}
        />
      </View>
      <View style={styles.doneCol}>
        <View style={[styles.doneBox, isCurrent ? styles.doneBoxOutline : styles.doneBoxFilled]}>
          <MaterialIcons
            name={isCurrent ? 'check-box-outline-blank' : 'check'}
            size={20}
            color={isCurrent ? 'rgba(10,29,55,0.3)' : PERFORMANCE_BLUE}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(10,29,55,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PERFORMANCE_BLUE,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  moreBtn: {
    padding: 4,
  },
  moreBtnPressed: {
    opacity: 0.7,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  gridHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setCol: {
    width: 48,
    textAlign: 'center',
  },
  weightCol: {
    flex: 2,
    marginLeft: 8,
  },
  repsCol: {
    flex: 2,
    marginLeft: 8,
  },
  doneCol: {
    width: 48,
    alignItems: 'flex-end',
  },
  setsList: {},
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  setRowCurrent: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  setNumWrap: {
    marginLeft: 0,
  },
  setNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  setNumCurrent: {
    color: PERFORMANCE_BLUE,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputReadonly: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  inputCurrent: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(10,29,55,0.2)',
    color: PERFORMANCE_BLUE,
  },
  doneBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBoxFilled: {
    backgroundColor: 'rgba(10,29,55,0.1)',
  },
  doneBoxOutline: {
    borderWidth: 2,
    borderColor: 'rgba(10,29,55,0.2)',
  },
  emptyWrap: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionBtnBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtnPressed: {
    backgroundColor: 'rgba(255,107,0,0.06)',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
});
