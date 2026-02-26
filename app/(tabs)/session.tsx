import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useActiveSession } from '@/contexts/ActiveSessionContext';
import { useStorage } from '@/contexts/StorageContext';
import type { Exercise, WorkoutExercise, WorkoutSet } from '@/src/domain';
import { generateId } from '@/src/adapters/sqlite/helpers';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ExerciseWithName = WorkoutExercise & { exerciseName: string };

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SessionTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeSessionId, setActiveSessionId } = useActiveSession();
  const { user, repositories, isReady } = useStorage();
  const [categoryName, setCategoryName] = useState('');
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
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [optMachine, setOptMachine] = useState('');
  const [optSeatHeight, setOptSeatHeight] = useState('');
  const [optBenchAngle, setOptBenchAngle] = useState('');
  const [optGrip, setOptGrip] = useState('');

  const loadSession = useCallback(async () => {
    if (!activeSessionId || !repositories || !user) return;
    const session = await repositories.workoutSession.getById(activeSessionId);
    if (!session) {
      setActiveSessionId(null);
      return;
    }
    const cat = await repositories.trainingCategory.getById(session.categoryId);
    setCategoryName(cat?.name ?? '');
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
      if (!repositories) return;
      await repositories.workoutSet.update(setId, patch);
      await loadSession();
    },
    [repositories, loadSession]
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
      if (!repositories || !activeSessionId) return;
      const order = exercises.length + 1;
      await repositories.workoutExercise.create({
        sessionId: activeSessionId,
        exerciseId,
        order,
        machineName: optMachine.trim() || undefined,
        seatHeight: optSeatHeight.trim() || undefined,
        benchAngleDeg: optBenchAngle.trim() ? parseInt(optBenchAngle, 10) : undefined,
        grip: optGrip.trim() || undefined,
      });
      setAddExerciseModalVisible(false);
      setExerciseSearch('');
      setShowOptionalDetails(false);
      setOptMachine('');
      setOptSeatHeight('');
      setOptBenchAngle('');
      setOptGrip('');
      await loadSession();
    },
    [repositories, activeSessionId, exercises.length, optMachine, optSeatHeight, optBenchAngle, optGrip, loadSession]
  );

  const handleCreateCustomExercise = useCallback(async () => {
    const name = exerciseSearch.trim();
    if (!name || !repositories || !user) return;
    const ex = await repositories.exercise.create({
      id: generateId(),
      userId: user.id,
      name,
      isBuiltIn: false,
    });
    await handleSelectExercise(ex.id);
  }, [exerciseSearch, repositories, user, handleSelectExercise]);

  const safeCentered = [styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }];

  if (!isReady) {
    return (
      <ThemedView style={safeCentered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!activeSessionId) {
    return (
      <ThemedView style={safeCentered}>
        <ThemedText type="subtitle">Session</ThemedText>
        <ThemedText style={styles.emptyText}>No active workout — Start from Home</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={safeCentered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="defaultSemiBold" style={styles.headerText}>{categoryName}</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.headerText}>{formatElapsed(elapsed)}</ThemedText>
        <Pressable style={styles.finishButton} onPress={() => setFinishModalVisible(true)}>
          <ThemedText style={styles.finishButtonText}>Finish</ThemedText>
        </Pressable>
      </ThemedView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
      >
        {exercises.map((we) => (
          <ThemedView key={we.id} style={styles.exerciseBlock}>
            <ThemedText type="defaultSemiBold">{we.exerciseName}</ThemedText>
            {(setsByWeId[we.id] ?? []).map((set, idx) => (
              <ThemedView key={set.id} style={styles.setRow}>
                <ThemedText style={styles.setNum}>{idx + 1}</ThemedText>
                <TextInput
                  style={styles.setInput}
                  keyboardType="number-pad"
                  placeholder="Reps"
                  placeholderTextColor="#687076"
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(t) => {
                  const n = t ? parseInt(t, 10) : 0;
                  if (!Number.isNaN(n)) handleUpdateSet(set.id, { reps: n });
                }}
                />
                <TextInput
                  style={styles.setInput}
                  keyboardType="decimal-pad"
                  placeholder="Weight"
                  placeholderTextColor="#687076"
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(t) => {
                  const n = t ? parseFloat(t) : 0;
                  if (!Number.isNaN(n)) handleUpdateSet(set.id, { weight: n });
                }}
                />
                <Pressable onPress={() => handleDeleteSet(set.id)} style={styles.deleteSetBtn}>
                  <ThemedText style={styles.deleteSetText}>✕</ThemedText>
                </Pressable>
              </ThemedView>
            ))}
            <Pressable style={styles.addSetBtn} onPress={() => handleAddSet(we.id)}>
              <ThemedText style={styles.addSetText}>+ Add Set</ThemedText>
            </Pressable>
          </ThemedView>
        ))}

        <Pressable
          style={styles.addExerciseBtn}
          onPress={() => setAddExerciseModalVisible(true)}
        >
          <ThemedText style={styles.addExerciseText}>+ Add Exercise</ThemedText>
        </Pressable>
      </ScrollView>

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
            <ThemedView style={styles.modalButtons}>
              <Pressable style={styles.modalCancel} onPress={() => setFinishModalVisible(false)}>
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleFinish}>
                <ThemedText style={styles.finishButtonText}>Save</ThemedText>
              </Pressable>
            </ThemedView>
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
          <Pressable style={styles.optionalToggle} onPress={() => setShowOptionalDetails((v) => !v)}>
            <ThemedText style={styles.optionalToggleText}>
              {showOptionalDetails ? '−' : '+'} Optional details
            </ThemedText>
          </Pressable>
          {showOptionalDetails && (
            <ThemedView style={styles.optionalFields}>
              <TextInput style={styles.optionalInput} placeholder="Machine name" placeholderTextColor="#687076" value={optMachine} onChangeText={setOptMachine} />
              <TextInput style={styles.optionalInput} placeholder="Seat height" placeholderTextColor="#687076" value={optSeatHeight} onChangeText={setOptSeatHeight} />
              <TextInput style={styles.optionalInput} placeholder="Bench angle (deg)" placeholderTextColor="#687076" value={optBenchAngle} onChangeText={setOptBenchAngle} keyboardType="number-pad" />
              <TextInput style={styles.optionalInput} placeholder="Grip" placeholderTextColor="#687076" value={optGrip} onChangeText={setOptGrip} />
            </ThemedView>
          )}
          <ScrollView>
            {exerciseSearch.trim() && (
              <Pressable style={styles.row} onPress={handleCreateCustomExercise}>
                <ThemedText style={styles.createCustomText}>
                  Create &quot;{exerciseSearch.trim()}&quot;
                </ThemedText>
              </Pressable>
            )}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 8, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: BrandColors.navy,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  headerText: { color: BrandColors.white },
  finishButton: {
    backgroundColor: BrandColors.action,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: { color: BrandColors.white, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  exerciseBlock: { marginBottom: 24 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  setNum: { width: 24, fontSize: 14, color: BrandColors.text },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 44,
    color: BrandColors.text,
  },
  deleteSetBtn: { padding: 8 },
  deleteSetText: { color: BrandColors.danger, fontSize: 18 },
  addSetBtn: { marginTop: 8 },
  addSetText: { color: BrandColors.action, fontWeight: '600' },
  addExerciseBtn: {
    marginTop: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: BrandColors.action,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addExerciseText: { color: BrandColors.action, fontWeight: '600' },
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
    backgroundColor: BrandColors.action,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
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
  createCustomText: { color: BrandColors.action, fontWeight: '600' },
  optionalToggle: { padding: 12, marginBottom: 8 },
  optionalToggleText: { color: BrandColors.action },
  optionalFields: { marginBottom: 16, gap: 8 },
  optionalInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
    color: BrandColors.text,
  },
});
