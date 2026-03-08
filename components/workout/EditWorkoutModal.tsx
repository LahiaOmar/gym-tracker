import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import type { Exercise, TrainingCategory } from '@/src/domain';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const ACCENT = BrandColors.performanceAccent;

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const AVAILABLE_ICONS: MaterialIconName[] = [
  'fitness-center',
  'sports-gymnastics',
  'directions-run',
  'rowing',
  'accessibility-new',
  'self-improvement',
  'sports-martial-arts',
  'sports-kabaddi',
  'sports-handball',
  'sports-tennis',
  'sports-soccer',
  'sports-basketball',
  'sports-volleyball',
  'pool',
  'pedal-bike',
  'hiking',
  'downhill-skiing',
  'snowboarding',
  'surfing',
  'skateboarding',
  'sports-golf',
  'sports-baseball',
  'sports-hockey',
  'sports-rugby',
  'sports-cricket',
  'sports-mma',
  'sports-motorsports',
  'sports-esports',
  'emoji-events',
  'military-tech',
  'timer',
  'speed',
  'bolt',
  'whatshot',
  'local-fire-department',
  'favorite',
  'star',
];

interface EditWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    icon: MaterialIconName;
    exerciseIds: string[];
  }) => Promise<void>;
  category: TrainingCategory | null;
  defaultExerciseIds: string[];
  exercises: Exercise[];
  loading?: boolean;
  onAddExercise?: (name: string) => Promise<Exercise | void>;
}

type Step = 1 | 2;

export function EditWorkoutModal({
  visible,
  onClose,
  onSubmit,
  category,
  defaultExerciseIds,
  exercises,
  loading = false,
  onAddExercise,
}: EditWorkoutModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MaterialIconName>('fitness-center');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);

  useEffect(() => {
    if (visible && category) {
      setName(category.name);
      setSelectedIcon((category.icon as MaterialIconName) || 'fitness-center');
      setSelectedExerciseIds(defaultExerciseIds);
      setStep(1);
      setExerciseSearch('');
      setNewExerciseName('');
    }
  }, [visible, category, defaultExerciseIds]);

  const resetForm = useCallback(() => {
    setStep(1);
    setName('');
    setSelectedIcon('fitness-center');
    setSelectedExerciseIds([]);
    setExerciseSearch('');
    setNewExerciseName('');
  }, []);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [exercises, exerciseSearch]);

  const selectedExercises = useMemo(() => {
    return selectedExerciseIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter(Boolean) as Exercise[];
  }, [selectedExerciseIds, exercises]);

  const toggleExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseIds((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      }
      return [...prev, exerciseId];
    });
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  const handleAddExercise = useCallback(async () => {
    const trimmedName = newExerciseName.trim();
    if (!trimmedName || !onAddExercise) return;

    setAddingExercise(true);
    try {
      const newExercise = await onAddExercise(trimmedName);
      if (newExercise) {
        setSelectedExerciseIds((prev) => [...prev, newExercise.id]);
      }
      setNewExerciseName('');
    } catch (e) {
      console.error(e);
    } finally {
      setAddingExercise(false);
    }
  }, [newExerciseName, onAddExercise]);

  const handleNext = useCallback(() => {
    if (step === 1 && name.trim()) {
      setStep(2);
    }
  }, [step, name]);

  const handleBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  }, [step, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        icon: selectedIcon,
        exerciseIds: selectedExerciseIds,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }, [name, selectedIcon, selectedExerciseIds, onSubmit, onClose]);

  const canProceed = step === 1 ? name.trim().length > 0 : true;
  const isLastStep = step === 2;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
                onPress={handleBack}
              >
                <MaterialIcons
                  name={step === 1 ? 'close' : 'arrow-back'}
                  size={24}
                  color={BrandColors.slate}
                />
              </Pressable>
              <Text style={styles.headerTitle}>
                {step === 1 ? 'Edit Workout' : 'Select Exercises'}
              </Text>
              <View style={styles.headerBtn} />
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>

            {/* Content */}
            {step === 1 ? (
              <Step1Content
                name={name}
                setName={setName}
                selectedIcon={selectedIcon}
                setSelectedIcon={setSelectedIcon}
              />
            ) : (
              <Step2Content
                exercises={filteredExercises}
                selectedExerciseIds={selectedExerciseIds}
                selectedExercises={selectedExercises}
                exerciseSearch={exerciseSearch}
                setExerciseSearch={setExerciseSearch}
                toggleExercise={toggleExercise}
                removeExercise={removeExercise}
                newExerciseName={newExerciseName}
                setNewExerciseName={setNewExerciseName}
                onAddExercise={handleAddExercise}
                addingExercise={addingExercise}
              />
            )}

            {/* Footer */}
            <View style={styles.footer}>
              {isLastStep ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (submitting || loading) && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#fff" />
                      <Text style={styles.primaryBtnText}>Save Changes</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    !canProceed && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleNext}
                  disabled={!canProceed}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

interface Step1ContentProps {
  name: string;
  setName: (name: string) => void;
  selectedIcon: MaterialIconName;
  setSelectedIcon: (icon: MaterialIconName) => void;
}

function Step1Content({ name, setName, selectedIcon, setSelectedIcon }: Step1ContentProps) {
  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.step1Content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Icon Preview */}
      <View style={styles.iconPreviewContainer}>
        <View style={styles.iconPreviewRing}>
          <View style={styles.iconPreview}>
            <MaterialIcons name={selectedIcon} size={48} color={PERFORMANCE_BLUE} />
          </View>
        </View>
      </View>

      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Workout Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Leg Day, Push Day, Full Body"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
      </View>

      {/* Icon Selector */}
      <View style={styles.iconSelectorContainer}>
        <Text style={styles.inputLabel}>Choose Icon</Text>
        <View style={styles.iconGrid}>
          {AVAILABLE_ICONS.map((iconName) => (
            <Pressable
              key={iconName}
              style={({ pressed }) => [
                styles.iconOption,
                selectedIcon === iconName && styles.iconOptionSelected,
                pressed && styles.iconOptionPressed,
              ]}
              onPress={() => setSelectedIcon(iconName)}
            >
              <MaterialIcons
                name={iconName}
                size={24}
                color={selectedIcon === iconName ? '#fff' : PERFORMANCE_BLUE}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

interface Step2ContentProps {
  exercises: Exercise[];
  selectedExerciseIds: string[];
  selectedExercises: Exercise[];
  exerciseSearch: string;
  setExerciseSearch: (search: string) => void;
  toggleExercise: (exerciseId: string) => void;
  removeExercise: (exerciseId: string) => void;
  newExerciseName: string;
  setNewExerciseName: (name: string) => void;
  onAddExercise: () => void;
  addingExercise: boolean;
}

function Step2Content({
  exercises,
  selectedExerciseIds,
  selectedExercises,
  exerciseSearch,
  setExerciseSearch,
  toggleExercise,
  removeExercise,
  newExerciseName,
  setNewExerciseName,
  onAddExercise,
  addingExercise,
}: Step2ContentProps) {
  return (
    <View style={styles.content}>
      {/* Selected Exercises Chips */}
      {selectedExercises.length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chipsScrollContent}
          >
            {selectedExercises.map((ex) => (
              <View key={ex.id} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.chipRemove, pressed && styles.chipRemovePressed]}
                  onPress={() => removeExercise(ex.id)}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={16} color={PERFORMANCE_BLUE} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.selectedCount}>
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#94A3B8"
          value={exerciseSearch}
          onChangeText={setExerciseSearch}
        />
        {exerciseSearch.length > 0 && (
          <Pressable onPress={() => setExerciseSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={20} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {/* Add New Exercise Row */}
      <View style={styles.addExerciseRow}>
        <TextInput
          style={styles.addExerciseInput}
          placeholder="Add new exercise..."
          placeholderTextColor="#94A3B8"
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          onSubmitEditing={onAddExercise}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [
            styles.addExerciseBtn,
            (!newExerciseName.trim() || addingExercise) && styles.addExerciseBtnDisabled,
            pressed && styles.addExerciseBtnPressed,
          ]}
          onPress={onAddExercise}
          disabled={!newExerciseName.trim() || addingExercise}
        >
          {addingExercise ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="add" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        style={styles.exerciseList}
        contentContainerStyle={styles.exerciseListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = selectedExerciseIds.includes(item.id);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.exerciseRow,
                isSelected && styles.exerciseRowSelected,
                pressed && styles.exerciseRowPressed,
              ]}
              onPress={() => toggleExercise(item.id)}
            >
              <View style={styles.exerciseInfo}>
                <Text
                  style={[styles.exerciseName, isSelected && styles.exerciseNameSelected]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.isBuiltIn && <Text style={styles.exerciseTag}>Built-in</Text>}
              </View>
              <View
                style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              >
                {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
      />

      {selectedExercises.length === 0 && (
        <View style={styles.hintContainer}>
          <MaterialIcons name="info-outline" size={16} color="#94A3B8" />
          <Text style={styles.hintText}>
            Select exercises that will be automatically added when you start this workout
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PERFORMANCE_BLUE,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: ACCENT,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  content: {
    flex: 1,
  },
  step1Content: {
    padding: 20,
    paddingBottom: 40,
  },
  iconPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconPreviewRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(10, 29, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: BrandColors.text,
    backgroundColor: '#F8FAFC',
  },
  iconSelectorContainer: {
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 29, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: PERFORMANCE_BLUE,
  },
  iconOptionPressed: {
    opacity: 0.7,
  },
  chipsContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 29, 55, 0.08)',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    maxWidth: 160,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: PERFORMANCE_BLUE,
    flexShrink: 1,
  },
  chipRemove: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemovePressed: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  selectedCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.text,
  },
  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  addExerciseInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addExerciseBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseBtnDisabled: {
    opacity: 0.5,
  },
  addExerciseBtnPressed: {
    opacity: 0.9,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  exerciseRowSelected: {
    backgroundColor: 'rgba(10, 29, 55, 0.08)',
  },
  exerciseRowPressed: {
    opacity: 0.8,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.text,
    flexShrink: 1,
  },
  exerciseNameSelected: {
    color: PERFORMANCE_BLUE,
    fontWeight: '600',
  },
  exerciseTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
