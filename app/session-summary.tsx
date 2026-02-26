import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { setVolume } from '@/src/domain';
import type { WorkoutSession, WorkoutExercise, WorkoutSet } from '@/src/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function formatDuration(startedAt: string, endedAt: string): string {
  const s = new Date(startedAt).getTime();
  const e = new Date(endedAt).getTime();
  const mins = Math.round((e - s) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function SessionSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user, repositories, isReady } = useStorage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [exercisesWithSets, setExercisesWithSets] = useState<{ name: string; sets: WorkoutSet[] }[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [prs, setPrs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId || !repositories || !user) return;
    const s = await repositories.workoutSession.getById(sessionId);
    if (!s || !s.endedAt) {
      setSession(null);
      setLoading(false);
      return;
    }
    setSession(s);
    const cat = await repositories.trainingCategory.getById(s.categoryId);
    setCategoryName(cat?.name ?? '');

    const weList = await repositories.workoutExercise.list({ filter: { sessionId: s.id } });
    const list: { name: string; sets: WorkoutSet[] }[] = [];
    let vol = 0;
    const exerciseIds: string[] = [];
    for (const we of weList) {
      const ex = await repositories.exercise.getById(we.exerciseId);
      const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
      list.push({ name: ex?.name ?? '?', sets });
      for (const set of sets) {
        vol += setVolume(set);
      }
      exerciseIds.push(we.exerciseId);
    }
    setExercisesWithSets(list);
    setTotalVolume(vol);

    const newPrs: string[] = [];
    for (let i = 0; i < exerciseIds.length; i++) {
      const exerciseId = exerciseIds[i];
      const sessionSetsForEx = list[i]?.sets ?? [];
      const sessionMax = Math.max(0, ...sessionSetsForEx.map((x) => x.weight));
      if (sessionMax === 0) continue;
      const allSets = await repositories.workoutSet.listSetsByExercise(user.id, exerciseId);
      const overallMax = Math.max(0, ...allSets.map((x) => x.weight));
      if (sessionMax >= overallMax) {
        const ex = await repositories.exercise.getById(exerciseId);
        if (ex) newPrs.push(ex.name);
      }
    }
    setPrs(newPrs);
  }, [sessionId, repositories, user]);

  useEffect(() => {
    if (isReady && sessionId && repositories) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isReady, sessionId, repositories, load]);

  if (!isReady || loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Session not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}
    >
      <ThemedText type="title">Workout complete</ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">{categoryName}</ThemedText>
        <ThemedText style={styles.detail}>
          Duration: {formatDuration(session.startedAt, session.endedAt!)}
        </ThemedText>
        <ThemedText style={styles.detail}>
          Total volume: {totalVolume.toLocaleString()} {user?.weightUnit ?? 'kg'}
        </ThemedText>
      </ThemedView>
      {prs.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">PR achieved</ThemedText>
          {prs.map((name) => (
            <ThemedText key={name} style={styles.detail}>{name}</ThemedText>
          ))}
        </ThemedView>
      )}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Exercises</ThemedText>
        {exercisesWithSets.map(({ name, sets }) => (
          <ThemedView key={name} style={styles.exercise}>
            <ThemedText>{name}</ThemedText>
            {sets.map((set, i) => (
              <ThemedText key={set.id} style={styles.setLine}>
                Set {i + 1}: {set.reps} × {set.weight} {user?.weightUnit ?? 'kg'}
              </ThemedText>
            ))}
          </ThemedView>
        ))}
      </ThemedView>
      <Pressable
        style={styles.doneButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <ThemedText style={styles.doneButtonText}>Done</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  detail: { marginTop: 4, color: BrandColors.slate },
  exercise: { marginTop: 12 },
  setLine: { marginTop: 2, fontSize: 14, color: BrandColors.text },
  doneButton: {
    marginTop: 24,
    backgroundColor: BrandColors.action,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: { color: BrandColors.white, fontSize: 18, fontWeight: '600' },
});
