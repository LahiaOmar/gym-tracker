import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ExerciseHighlightCard,
  IntensityPicker,
  type IntensityOption,
  SummaryHeader,
  SummaryRow,
  SummaryStatCard,
} from '@/components/session-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors } from '@/constants/theme';
import { useSessions } from '@/contexts/SessionsContext';
import { useStorage } from '@/contexts/StorageContext';
import { setVolume } from '@/src/domain';
import type { WorkoutSession, WorkoutSet } from '@/src/domain';

function formatDurationMmSs(startedAt: string, endedAt: string): string {
  const s = new Date(startedAt).getTime();
  const e = new Date(endedAt).getTime();
  const totalSeconds = Math.round((e - s) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSessionSubtitle(categoryName: string, endedAt: string): string {
  const d = new Date(endedAt);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const dayLabel = isToday ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${categoryName} • ${dayLabel}, ${time}`;
}

/** Best set = heaviest by weight; format "100kg x 5" */
function getBestSetLabel(sets: WorkoutSet[], weightUnit: string): string {
  if (sets.length === 0) return '—';
  const best = sets.reduce((a, b) => (b.weight >= a.weight ? b : a));
  return `${best.weight}${weightUnit} x ${best.reps}`;
}

export default function SessionSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user, repositories, isReady } = useStorage();
  const { refetch } = useSessions();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [exercisesWithSets, setExercisesWithSets] = useState<
    { id: string; name: string; sets: WorkoutSet[]; imageUri?: string | null }[]
  >([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [prs, setPrs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [intensity, setIntensity] = useState<IntensityOption | null>(null);

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

    const weList = await repositories.workoutExercise.list({
      filter: { sessionId: s.id },
    });
    const list: { id: string; name: string; sets: WorkoutSet[]; imageUri?: string | null }[] = [];
    let vol = 0;
    let setCount = 0;
    const exerciseIds: string[] = [];
    for (const we of weList) {
      const ex = await repositories.exercise.getById(we.exerciseId);
      const sets = await repositories.workoutSet.list({
        filter: { workoutExerciseId: we.id },
      });
      list.push({
        id: we.id,
        name: ex?.name ?? '?',
        sets,
        imageUri: null,
      });
      for (const set of sets) {
        vol += setVolume(set);
        setCount += 1;
      }
      exerciseIds.push(we.exerciseId);
    }
    setExercisesWithSets(list);
    setTotalVolume(vol);
    setTotalSets(setCount);

    const newPrs: string[] = [];
    for (let i = 0; i < exerciseIds.length; i++) {
      const exerciseId = exerciseIds[i];
      const sessionSetsForEx = list[i]?.sets ?? [];
      const sessionMax = Math.max(0, ...sessionSetsForEx.map((x) => x.weight));
      if (sessionMax === 0) continue;
      const allSets = await repositories.workoutSet.listSetsByExercise(
        user.id,
        exerciseId
      );
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

  useEffect(() => {
    if (sessionId) refetch(true);
  }, [sessionId, refetch]);

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
  const subtitle = formatSessionSubtitle(categoryName, session.endedAt!);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SummaryHeader title="Workout Complete!" subtitle={subtitle} />

        <View style={styles.main}>
          <View style={styles.statRow}>
            <SummaryStatCard
              icon="timer"
              label="Duration"
              value={formatDurationMmSs(session.startedAt, session.endedAt!)}
            />
            <View style={styles.statGap} />
            <SummaryStatCard
              icon="fitness-center"
              label="Volume"
              value={totalVolume.toLocaleString()}
              unit={weightUnit}
            />
          </View>

          <SummaryRow
            leftIcon="repeat"
            leftLabel="Sets Completed"
            leftValue={String(totalSets)}
            rightLabel="PRs Broken"
            rightValue={String(prs.length)}
            rightValueAccent
          />

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              EXERCISE HIGHLIGHTS
            </ThemedText>
            <View style={styles.highlightsList}>
              {exercisesWithSets.map(({ id, name, sets, imageUri }) => (
                <ExerciseHighlightCard
                  key={id}
                  title={name}
                  bestSet={getBestSetLabel(sets, weightUnit)}
                  imageUri={imageUri}
                  isPr={prs.includes(name)}
                />
              ))}
            </View>
          </View>

          <IntensityPicker selected={intensity} onSelect={setIntensity} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: 16 + insets.bottom,
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.doneButtonPressed,
          ]}
          onPress={() => router.replace('/(tabs)')}
        >
          <ThemedText style={styles.doneButtonText}>Done</ThemedText>
        </Pressable>
      </View>
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
    paddingHorizontal: 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    marginTop: -40,
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statGap: {
    width: 16,
  },
  section: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BrandColors.slate400,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  highlightsList: {
    gap: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 48,
    paddingHorizontal: 24,
    backgroundColor: BrandColors.iosBg,
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
      },
    }),
  },
  doneButton: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    backgroundColor: BrandColors.performanceAccent,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: BrandColors.performanceAccent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
      },
      android: { elevation: 8 },
    }),
  },
  doneButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.97 }],
  },
  doneButtonText: {
    color: BrandColors.white,
    fontSize: 18,
    fontWeight: '800',
  },
});
