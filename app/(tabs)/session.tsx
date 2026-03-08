import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ExerciseCard,
  FAB,
  formatElapsedToParts,
  SessionHeader,
} from '@/components/session';
import type { SetRowData } from '@/components/session';
import { SessionsList } from '@/components/SessionsList';
import { BrandColors } from '@/constants/theme';
import { useActiveSession } from '@/contexts/ActiveSessionContext';
import { useStorage } from '@/contexts/StorageContext';
import type { Exercise, WorkoutExercise, WorkoutSet } from '@/src/domain';
import { generateId } from '@/src/adapters/sqlite/helpers';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getWeightUnit, toStorageWeight, toDisplayWeight } from '@/utils/weight';

type ExerciseWithName = WorkoutExercise & { exerciseName: string };

export default function SessionTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeSessionId, setActiveSessionId } = useActiveSession();
  const { user, repositories, isReady } = useStorage();
  const [categoryName, setCategoryName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<ExerciseWithName[]>([]);
  const [setsByWeId, setSetsByWeId] = useState<Record<string, WorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [editingExerciseDetails, setEditingExerciseDetails] = useState<ExerciseWithName | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [optMachine, setOptMachine] = useState('');
  const [optSeatHeight, setOptSeatHeight] = useState('');
  const [optBenchAngle, setOptBenchAngle] = useState('');
  const [optGrip, setOptGrip] = useState('');
  const [optNotes, setOptNotes] = useState('');

  const loadSession = useCallback(async () => {
    if (!activeSessionId || !repositories || !user) return;
    const session = await repositories.workoutSession.getById(activeSessionId);
    if (!session) {
      setActiveSessionId(null);
      return;
    }
    const cat = await repositories.trainingCategory.getById(session.categoryId);
    setCategoryName(cat?.name ?? '');
    setCategoryId(session.categoryId);
    setStartedAt(session.startedAt);

    const weList = await repositories.workoutExercise.list({ filter: { sessionId: activeSessionId } });
    const withNames: ExerciseWithName[] = [];
    const setsMap: Record<string, WorkoutSet[]> = {};
    for (const we of weList) {
      const ex = await repositories.exercise.getById(we.exerciseId);
      withNames.push({ ...we, exerciseName: ex?.name ?? '?' });
      const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
      setsMap[we.id] = sets;
    }
    setExercises(withNames);
    setSetsByWeId(setsMap);
  }, [activeSessionId, repositories, user, setActiveSessionId]);

  useEffect(() => {
    if (isReady && activeSessionId && repositories) {
      setLoading(true);
      loadSession().finally(() => setLoading(false));
    } else if (!activeSessionId) {
      setExercises([]);
      setSetsByWeId({});
    }
  }, [isReady, activeSessionId, repositories, loadSession]);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const handleAddSet = useCallback(
    async (workoutExerciseId: string) => {
      if (!repositories) return;
      const current = setsByWeId[workoutExerciseId] ?? [];
      const order = current.length + 1;
      await repositories.workoutSet.create({
        workoutExerciseId,
        order,
        reps: 0,
        weight: 0,
      });
      await loadSession();
    },
    [repositories, setsByWeId, loadSession]
  );

  const handleUpdateSet = useCallback(
    async (setId: string, patch: { reps?: number; weight?: number }) => {
      if (!repositories || !user) return;
      const unit = getWeightUnit(user.weightUnit);
      const updatedPatch = { ...patch };
      if (patch.weight !== undefined) {
        updatedPatch.weight = toStorageWeight(patch.weight, unit);
      }
      
      // Optimistically update local state to prevent input glitching
      setSetsByWeId((prev) => {
        const newState = { ...prev };
        for (const weId of Object.keys(newState)) {
          newState[weId] = newState[weId].map((set) =>
            set.id === setId ? { ...set, ...updatedPatch } : set
          );
        }
        return newState;
      });
      
      // Persist to database without reloading (no re-render)
      await repositories.workoutSet.update(setId, updatedPatch);
    },
    [repositories, user]
  );

  const handleDeleteSet = useCallback(
    async (setId: string) => {
      if (!repositories) return;
      await repositories.workoutSet.delete(setId);
      await loadSession();
    },
    [repositories, loadSession]
  );

  const handleFinish = useCallback(async () => {
    if (!activeSessionId || !repositories) return;
    await repositories.workoutSession.update(activeSessionId, {
      endedAt: new Date().toISOString(),
      notes: sessionNotes.trim() || undefined,
    });
    setActiveSessionId(null);
    setFinishModalVisible(false);
    setSessionNotes('');
    router.replace({ pathname: '/session-summary', params: { sessionId: activeSessionId } });
  }, [activeSessionId, repositories, sessionNotes, setActiveSessionId, router]);

  const loadExercises = useCallback(async () => {
    if (!repositories || !user) return;
    const list = await repositories.exercise.list({
      filter: { userId: user.id },
      limit: 100,
    });
    const builtIn = await repositories.exercise.list({
      filter: { userId: null, isBuiltIn: true },
      limit: 100,
    });
    const combined = [...builtIn, ...list.filter((e) => !e.isBuiltIn)];
    const search = exerciseSearch.trim().toLowerCase();
    const filtered = search
      ? combined.filter((e) => e.name.toLowerCase().includes(search))
      : combined;
    setExerciseList(filtered);
  }, [repositories, user, exerciseSearch]);

  useEffect(() => {
    if (addExerciseModalVisible) loadExercises();
  }, [addExerciseModalVisible, exerciseSearch, loadExercises]);

  const handleSelectExercise = useCallback(
    async (exerciseId: string) => {
      if (!repositories || !activeSessionId || !categoryId) return;
      const order = exercises.length + 1;
      await repositories.workoutExercise.create({
        sessionId: activeSessionId,
        exerciseId,
        order,
      });

      const defaultExercises = await repositories.categoryDefaultExercise.list({
        filter: { categoryId },
      });
      const alreadyDefault = defaultExercises.some((de) => de.exerciseId === exerciseId);
      if (!alreadyDefault) {
        const maxOrder = defaultExercises.reduce((max, de) => Math.max(max, de.order), 0);
        await repositories.categoryDefaultExercise.create({
          categoryId,
          exerciseId,
          order: maxOrder + 1,
        });
      }

      setAddExerciseModalVisible(false);
      setExerciseSearch('');
      await loadSession();
    },
    [repositories, activeSessionId, categoryId, exercises.length, loadSession]
  );

  const handleOpenExerciseDetails = useCallback((we: ExerciseWithName) => {
    setEditingExerciseDetails(we);
    setOptMachine(we.machineName ?? '');
    setOptSeatHeight(we.seatHeight ?? '');
    setOptBenchAngle(we.benchAngleDeg != null ? String(we.benchAngleDeg) : '');
    setOptGrip(we.grip ?? '');
    setOptNotes(we.notes ?? '');
  }, []);

  const handleSaveExerciseDetails = useCallback(async () => {
    if (!repositories || !editingExerciseDetails) return;
    await repositories.workoutExercise.update(editingExerciseDetails.id, {
      machineName: optMachine.trim() || null,
      seatHeight: optSeatHeight.trim() || null,
      benchAngleDeg: optBenchAngle.trim() ? parseInt(optBenchAngle, 10) : null,
      grip: optGrip.trim() || null,
      notes: optNotes.trim() || null,
    });
    setEditingExerciseDetails(null);
    setOptMachine('');
    setOptSeatHeight('');
    setOptBenchAngle('');
    setOptGrip('');
    setOptNotes('');
    await loadSession();
  }, [repositories, editingExerciseDetails, optMachine, optSeatHeight, optBenchAngle, optGrip, optNotes, loadSession]);

  const handleCancelExerciseDetails = useCallback(() => {
    setEditingExerciseDetails(null);
    setOptMachine('');
    setOptSeatHeight('');
    setOptBenchAngle('');
    setOptGrip('');
    setOptNotes('');
  }, []);

  const handleCreateCustomExercise = useCallback(async () => {
    const name = newExerciseName.trim();
    if (!name || !repositories || !user || !activeSessionId || !categoryId) return;
    const ex = await repositories.exercise.create({
      id: generateId(),
      userId: user.id,
      name,
      isBuiltIn: false,
    });
    const order = exercises.length + 1;
    await repositories.workoutExercise.create({
      sessionId: activeSessionId,
      exerciseId: ex.id,
      order,
    });

    const defaultExercises = await repositories.categoryDefaultExercise.list({
      filter: { categoryId },
    });
    const maxOrder = defaultExercises.reduce((max, de) => Math.max(max, de.order), 0);
    await repositories.categoryDefaultExercise.create({
      categoryId,
      exerciseId: ex.id,
      order: maxOrder + 1,
    });

    setAddExerciseModalVisible(false);
    setExerciseSearch('');
    setNewExerciseName('');
    await loadSession();
  }, [newExerciseName, repositories, user, activeSessionId, categoryId, exercises.length, loadSession]);

  const timerParts = useMemo(() => formatElapsedToParts(elapsed), [elapsed]);

  const setsRowDataByWeId = useMemo(() => {
    const out: Record<string, SetRowData[]> = {};
    for (const we of exercises) {
      const sets = (setsByWeId[we.id] ?? []).slice().sort((a, b) => a.order - b.order);
      out[we.id] = sets.map((set, idx) => ({
        set,
        index: idx,
        isCurrent: idx === sets.length - 1,
      }));
    }
    return out;
  }, [exercises, setsByWeId]);

  const safeCentered = [styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }];

  if (!isReady) {
    return (
      <ThemedView style={safeCentered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!activeSessionId) {
    return <SessionsList />;
  }

  if (loading) {
    return (
      <ThemedView style={safeCentered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: BrandColors.iosBg }]}>
      <SessionHeader
        title={categoryName}
        timerParts={timerParts}
        onFinish={() => setFinishModalVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((we, exerciseIndex) => {
          const sets = setsRowDataByWeId[we.id] ?? [];
          const hasSets = sets.length > 0;
          const hasDetails = !!(we.machineName || we.seatHeight || we.benchAngleDeg || we.grip || we.notes);
          const detailParts: string[] = [];
          if (we.machineName) detailParts.push(we.machineName);
          if (we.seatHeight) detailParts.push(`Seat: ${we.seatHeight}`);
          if (we.benchAngleDeg) detailParts.push(`${we.benchAngleDeg}°`);
          if (we.grip) detailParts.push(we.grip);
          const subtitle = hasDetails ? detailParts.join(' • ') : undefined;
          const notesText = we.notes ? we.notes : undefined;
          return (
            <View key={we.id} style={styles.exerciseCardWrap}>
              <ExerciseCard
                title={we.exerciseName}
                subtitle={subtitle}
                notes={notesText}
                imageUri={undefined}
                sets={sets}
                onAddSet={() => handleAddSet(we.id)}
                onMorePress={() => handleOpenExerciseDetails(we)}
                onWeightChange={(setId, value) => handleUpdateSet(setId, { weight: value })}
                onRepsChange={(setId, value) => handleUpdateSet(setId, { reps: value })}
                hasSets={hasSets}
                disabled={exerciseIndex > 0 && !hasSets}
                weightUnit={getWeightUnit(user?.weightUnit)}
              />
            </View>
          );
        })}
      </ScrollView>

      <FAB onPress={() => setAddExerciseModalVisible(true)} />

      <Modal visible={finishModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setFinishModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="subtitle">Finish workout?</ThemedText>
            <TextInput
              style={styles.notesInput}
              placeholder="Session notes (optional)"
              placeholderTextColor="#687076"
              value={sessionNotes}
              onChangeText={setSessionNotes}
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setFinishModalVisible(false)}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleFinish}>
                <ThemedText style={styles.modalSaveText}>Save</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={addExerciseModalVisible} animationType="slide">
        <ThemedView style={[styles.modalFull, { paddingTop: 20 + insets.top }]}>
          <ThemedView style={styles.modalHeader}>
            <ThemedText type="subtitle">Add Exercise</ThemedText>
            <Pressable onPress={() => setAddExerciseModalVisible(false)}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
          </ThemedView>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises"
            placeholderTextColor="#687076"
            value={exerciseSearch}
            onChangeText={setExerciseSearch}
          />
          <View style={styles.addExerciseRow}>
            <TextInput
              style={styles.addExerciseInput}
              placeholder="Add new exercise..."
              placeholderTextColor="#94A3B8"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              onSubmitEditing={handleCreateCustomExercise}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [
                styles.addExerciseBtn,
                !newExerciseName.trim() && styles.addExerciseBtnDisabled,
                pressed && styles.addExerciseBtnPressed,
              ]}
              onPress={handleCreateCustomExercise}
              disabled={!newExerciseName.trim()}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
            </Pressable>
          </View>
          <ScrollView>
            {exerciseList.map((ex) => (
              <Pressable
                key={ex.id}
                style={styles.row}
                onPress={() => handleSelectExercise(ex.id)}
              >
                <ThemedText>{ex.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      <Modal visible={!!editingExerciseDetails} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.exerciseDetailsModal} onPress={Keyboard.dismiss}>
            <ThemedText type="subtitle" style={styles.exerciseDetailsTitle}>
              {editingExerciseDetails?.exerciseName}
            </ThemedText>
            <ThemedText style={styles.exerciseDetailsSubtitle}>Optional Details</ThemedText>
            <View style={styles.detailsFields}>
              <TextInput
                style={styles.detailInput}
                placeholder="Machine name"
                placeholderTextColor="#687076"
                value={optMachine}
                onChangeText={setOptMachine}
              />
              <TextInput
                style={styles.detailInput}
                placeholder="Seat height"
                placeholderTextColor="#687076"
                value={optSeatHeight}
                onChangeText={setOptSeatHeight}
              />
              <TextInput
                style={styles.detailInput}
                placeholder="Bench angle (deg)"
                placeholderTextColor="#687076"
                value={optBenchAngle}
                onChangeText={setOptBenchAngle}
                keyboardType="number-pad"
              />
              <TextInput
                style={styles.detailInput}
                placeholder="Grip (e.g., wide, narrow, neutral)"
                placeholderTextColor="#687076"
                value={optGrip}
                onChangeText={setOptGrip}
              />
              <TextInput
                style={styles.notesTextArea}
                placeholder="Personal notes (e.g., form tips, adjustments...)"
                placeholderTextColor="#687076"
                value={optNotes}
                onChangeText={setOptNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={handleCancelExerciseDetails}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveExerciseDetails}>
                <ThemedText style={styles.modalSaveText}>Save</ThemedText>
              </Pressable>
            </View>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  exerciseCardWrap: { marginBottom: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    padding: 24,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    minHeight: 80,
    color: BrandColors.text,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancel: { padding: 12 },
  modalSave: {
    backgroundColor: BrandColors.performanceAccent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalSaveText: { color: '#fff', fontWeight: '600' },
  modalFull: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cancelText: { color: BrandColors.action },
  searchInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: BrandColors.text,
  },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  addExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    backgroundColor: BrandColors.performanceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseBtnDisabled: {
    opacity: 0.5,
  },
  addExerciseBtnPressed: {
    opacity: 0.9,
  },
  exerciseDetailsModal: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  exerciseDetailsTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  exerciseDetailsSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsFields: {
    gap: 12,
    marginBottom: 20,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: BrandColors.text,
    backgroundColor: '#F8FAFC',
  },
  notesTextArea: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: BrandColors.text,
    backgroundColor: '#F8FAFC',
    minHeight: 80,
  },
});
