import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { setVolume } from '@/src/domain';
import type { WorkoutSession, WorkoutSet } from '@/src/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—';
  const s = new Date(startedAt).getTime();
  const e = new Date(endedAt).getTime();
  const mins = Math.round((e - s) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [exercisesWithSets, setExercisesWithSets] = useState<{ name: string; sets: WorkoutSet[] }[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id || !repositories || !user) return;
    const s = await repositories.workoutSession.getById(id);
    if (!s) {
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
    for (const we of weList) {
      const ex = await repositories.exercise.getById(we.exerciseId);
      const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
      list.push({ name: ex?.name ?? '?', sets });
      for (const set of sets) {
        vol += setVolume(set);
      }
    }
    setExercisesWithSets(list);
    setTotalVolume(vol);
  }, [id, repositories, user]);

  useEffect(() => {
    if (isReady && id && repositories) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isReady, id, repositories, load]);

  const handleRemoveSession = useCallback(() => {
    if (!id || !repositories) return;
    Alert.alert(
      'Remove session',
      'Remove this session? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await repositories.workoutSession.delete(id);
            router.back();
          },
        },
      ]
    );
  }, [id, repositories, router]);

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
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">{categoryName}</ThemedText>
        <ThemedText style={styles.detail}>{formatDate(session.startedAt)}</ThemedText>
        <ThemedText style={styles.detail}>
          Duration: {formatDuration(session.startedAt, session.endedAt)}
        </ThemedText>
        <ThemedText style={styles.detail}>
          Total volume: {totalVolume.toLocaleString()} {user?.weightUnit ?? 'kg'}
        </ThemedText>
        {session.notes ? (
          <ThemedText style={[styles.detail, styles.notes]}>{session.notes}</ThemedText>
        ) : null}
      </ThemedView>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Exercises</ThemedText>
        {exercisesWithSets.map(({ name, sets }) => (
          <ThemedView key={name} style={styles.exercise}>
            <ThemedText>{name}</ThemedText>
            {sets.map((set, i) => (
              <ThemedText key={set.id} style={styles.setLine}>
                Set {i + 1}: {set.reps} × {set.weight} {user?.weightUnit ?? 'kg'} ={' '}
                {setVolume(set)} vol
              </ThemedText>
            ))}
          </ThemedView>
        ))}
      </ThemedView>
      <Pressable
        style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
        onPress={handleRemoveSession}
      >
        <ThemedText style={styles.removeButtonText}>Remove session</ThemedText>
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  detail: { marginTop: 4, color: BrandColors.slate },
  notes: { fontStyle: 'italic' },
  exercise: { marginTop: 12 },
  setLine: { marginTop: 2, fontSize: 14, color: BrandColors.text },
  removeButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.danger,
    alignItems: 'center',
  },
  removeButtonPressed: { opacity: 0.9 },
  removeButtonText: { color: BrandColors.danger, fontWeight: '600' },
});
