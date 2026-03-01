import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ExerciseSetTableCard,
  SessionDetailHeader,
  SessionStatsOverviewCard,
} from '@/components/session-detail';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { setVolume } from '@/src/domain';
import type { WorkoutSession, WorkoutSet } from '@/src/domain';

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDurationMins(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—';
  const s = new Date(startedAt).getTime();
  const e = new Date(endedAt).getTime();
  const mins = Math.round((e - s) / 60000);
  return `${mins} min${mins !== 1 ? 's' : ''}`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [exercisesWithSets, setExercisesWithSets] = useState<{
    name: string;
    sets: WorkoutSet[];
    exerciseId: string;
  }[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [prSetIndexByExercise, setPrSetIndexByExercise] = useState<number[]>([]);
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
    const list: { name: string; sets: WorkoutSet[]; exerciseId: string }[] = [];
    let vol = 0;
    let setCount = 0;
    for (const we of weList) {
      const ex = await repositories.exercise.getById(we.exerciseId);
      const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
      list.push({ name: ex?.name ?? '?', sets, exerciseId: we.exerciseId });
      for (const set of sets) {
        vol += setVolume(set);
        setCount += 1;
      }
    }
    setExercisesWithSets(list);
    setTotalVolume(vol);
    setTotalSets(setCount);

    const prIndices: number[] = [];
    for (let i = 0; i < list.length; i++) {
      const { sets, exerciseId } = list[i];
      const sessionMax = Math.max(0, ...sets.map((x) => x.weight));
      if (sessionMax === 0) {
        prIndices.push(-1);
        continue;
      }
      const allSets = await repositories.workoutSet.listSetsByExercise(user.id, exerciseId);
      const overallMax = Math.max(0, ...allSets.map((x) => x.weight));
      if (sessionMax >= overallMax) {
        const maxSetIndex = sets.findIndex((x) => x.weight === sessionMax);
        prIndices.push(maxSetIndex >= 0 ? maxSetIndex : -1);
      } else {
        prIndices.push(-1);
      }
    }
    setPrSetIndexByExercise(prIndices);
  }, [id, repositories, user]);

  useEffect(() => {
    if (isReady && id && repositories) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isReady, id, repositories, load]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  const handleMore = useCallback(() => {
    Alert.alert('Session', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove session', style: 'destructive', onPress: handleRemoveSession },
    ]);
  }, [handleRemoveSession]);

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

  const weightUnit = user?.weightUnit ?? 'kg';
  const dateLabel = formatDateShort(session.startedAt);
  const durationLabel = formatDurationMins(session.startedAt, session.endedAt);

  return (
    <View style={styles.screen}>
      <SessionDetailHeader
        title={categoryName}
        dateLabel={dateLabel}
        durationLabel={durationLabel}
        onBack={handleBack}
        onShare={() => {}}
        onMore={handleMore}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.main}>
          <SessionStatsOverviewCard
            totalVolume={totalVolume}
            totalVolumeUnit={weightUnit}
            totalSets={totalSets}
          />
          <View style={styles.exercisesList}>
            {exercisesWithSets.map(({ name, sets, exerciseId }, index) => (
              <ExerciseSetTableCard
                key={`${exerciseId}-${name}`}
                exerciseName={name}
                sets={sets}
                weightUnit={weightUnit}
                prSetIndex={prSetIndexByExercise[index] ?? -1}
                prOnWeight={true}
                prBadgeVariant="trending_up"
              />
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.removeButtonPressed,
            ]}
            onPress={handleRemoveSession}
          >
            <ThemedText style={styles.removeButtonText}>Remove session</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BrandColors.iosBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  main: {
    gap: 24,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisesList: {
    gap: 24,
  },
  removeButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.danger,
    alignItems: 'center',
  },
  removeButtonPressed: {
    opacity: 0.9,
  },
  removeButtonText: {
    color: BrandColors.danger,
    fontWeight: '600',
  },
});
