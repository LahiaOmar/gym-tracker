import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useSessions } from '@/contexts/SessionsContext';
import { useStorage } from '@/contexts/StorageContext';
import { getSessionDurationMins, computeStreak, setVolume } from '@/src/domain';
import type { WorkoutSet } from '@/src/domain';
import { displayWeight, getUnitLabel, getWeightUnit } from '@/utils/weight';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ExerciseOptionalDetails = {
  machineName?: string | null;
  seatHeight?: string | null;
  benchAngleDeg?: number | null;
  grip?: string | null;
};

type ExerciseDetail = {
  name: string;
  sets: WorkoutSet[];
  totalVolume: number;
  optionalDetails: ExerciseOptionalDetails;
};

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const ACCENT = BrandColors.performanceAccent;
const IOS_BG = BrandColors.iosBg;
const DARK_GREY = BrandColors.darkGrey;
const SLATE_400 = '#94A3B8';
const SLATE_100 = '#F1F5F9';

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDate.getTime() === today.getTime()) return 'Today';
  if (dDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getThisWeekRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

function hasOptionalDetails(details: ExerciseOptionalDetails): boolean {
  return !!(details.machineName || details.seatHeight || details.benchAngleDeg !== null && details.benchAngleDeg !== undefined || details.grip);
}

function formatOptionalDetails(details: ExerciseOptionalDetails): string[] {
  const items: string[] = [];
  if (details.machineName) items.push(details.machineName);
  if (details.seatHeight) items.push(`Seat: ${details.seatHeight}`);
  if (details.benchAngleDeg !== null && details.benchAngleDeg !== undefined) items.push(`${details.benchAngleDeg}°`);
  if (details.grip) items.push(details.grip);
  return items;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const { sessionItems, isLoading: sessionsLoading } = useSessions();
  const [thisWeekMinutes, setThisWeekMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [exerciseDetails, setExerciseDetails] = useState<Record<string, ExerciseDetail[]>>({});
  const [loadingExercises, setLoadingExercises] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!repositories || !user) return;

    const { from, to } = getThisWeekRange();
    const weekSessions = await repositories.workoutSession.listSessionsByDateRange(
      user.id,
      from,
      to
    );

    let totalMins = 0;
    for (const s of weekSessions) {
      totalMins += getSessionDurationMins(s);
    }
    setThisWeekMinutes(totalMins);

    const allSessions = await repositories.workoutSession.list({
      filter: { userId: user.id },
      limit: 500,
      sort: { field: 'startedAt', direction: 'desc' },
    });
    setStreak(computeStreak(allSessions.map((s) => s.startedAt)));
  }, [repositories, user]);

  useEffect(() => {
    if (isReady && user && repositories) load();
  }, [isReady, user?.id, repositories, load]);

  const loadExercisesForSession = useCallback(async (sessionId: string) => {
    if (!repositories) return;
    if (exerciseDetails[sessionId]) return;

    setLoadingExercises(sessionId);
    try {
      const weList = await repositories.workoutExercise.list({ filter: { sessionId } });
      const details: ExerciseDetail[] = [];
      for (const we of weList) {
        const ex = await repositories.exercise.getById(we.exerciseId);
        const sets = await repositories.workoutSet.list({ filter: { workoutExerciseId: we.id } });
        let totalVolume = 0;
        for (const s of sets) totalVolume += setVolume(s);
        details.push({
          name: ex?.name ?? 'Unknown',
          sets,
          totalVolume,
          optionalDetails: {
            machineName: we.machineName,
            seatHeight: we.seatHeight,
            benchAngleDeg: we.benchAngleDeg,
            grip: we.grip,
          },
        });
      }
      setExerciseDetails((prev) => ({ ...prev, [sessionId]: details }));
    } finally {
      setLoadingExercises(null);
    }
  }, [repositories, exerciseDetails]);

  const handleSessionPress = useCallback(async (sessionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
      await loadExercisesForSession(sessionId);
    }
  }, [expandedSessionId, loadExercisesForSession]);

  const recentActivities = sessionItems.slice(0, 5);

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: IOS_BG }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const displayName = user?.displayName ?? 'Guest';
  const hours = Math.floor(thisWeekMinutes / 60);
  const mins = thisWeekMinutes % 60;
  const timeDisplay =
    hours > 0 && mins > 0
      ? `${hours}h ${mins}m`
      : hours > 0
        ? `${hours}h`
        : `${mins}m`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: 12 + insets.top, paddingBottom: 120 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.profileIcon, pressed && styles.buttonPressed]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MaterialIcons name="person" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <MaterialIcons name="bolt" size={20} color={ACCENT} />
            <Text style={styles.statCardLabel}>STREAK</Text>
          </View>
          <Text style={styles.statCardValue}>{streak} Days</Text>
          <Text style={styles.statCardSub}>{streak > 0 ? 'Personal Best!' : 'Start training'}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <MaterialIcons name="timer" size={20} color={ACCENT} />
            <Text style={styles.statCardLabel}>TIME</Text>
          </View>
          <Text style={styles.statCardValue}>{timeDisplay}</Text>
          <Text style={styles.statCardSub}>This week</Text>
        </View>
      </View>

      {/* Ready to train */}
      <View style={styles.readyCard}>
        <Text style={styles.readyTitle}>Ready to train?</Text>
        <View style={styles.readyButtons}>
          <Pressable
            style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/select-category')}
          >
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.browseButton, pressed && styles.browseButtonPressed]}
            onPress={() => router.push('/(tabs)/session')}
          >
            <Text style={styles.browseButtonText}>Browse Routine</Text>
          </Pressable>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => router.push('/(tabs)/session')}>
            <Text style={styles.viewAllText}>VIEW ALL</Text>
          </Pressable>
        </View>
        <View style={styles.activityList}>
          {sessionsLoading ? (
            <View style={styles.activityCard}>
              <View style={styles.activityIconWrap}>
                <MaterialIcons name="fitness-center" size={24} color={PERFORMANCE_BLUE} />
              </View>
              <View style={styles.activityContent}>
                <ActivityIndicator size="small" color={ACCENT} style={styles.recentRefreshSpinner} />
                <Text style={styles.activityMeta}>Updating…</Text>
              </View>
            </View>
          ) : recentActivities.length === 0 ? (
            <View style={styles.activityCard}>
              <View style={styles.activityIconWrap}>
                <MaterialIcons name="fitness-center" size={24} color={PERFORMANCE_BLUE} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityName}>No sessions yet</Text>
                <Text style={styles.activityMeta}>Start your first workout</Text>
              </View>
            </View>
          ) : (
            recentActivities.map((item) => {
              const isExpanded = expandedSessionId === item.session.id;
              const exercises = exerciseDetails[item.session.id] ?? [];
              const isLoadingThis = loadingExercises === item.session.id;

              return (
                <View key={item.session.id} style={styles.activityCardWrapper}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.activityCard,
                      isExpanded && styles.activityCardExpanded,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => handleSessionPress(item.session.id)}
                  >
                    <View style={styles.activityLeft}>
                      <View style={styles.activityIconWrap}>
                        <MaterialIcons
                          name={(item.categoryIcon as MaterialIconName) || 'fitness-center'}
                          size={24}
                          color={PERFORMANCE_BLUE}
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityName}>{item.categoryName}</Text>
                        <Text style={styles.activityMeta}>
                          {formatRelativeDate(item.session.startedAt)} • {item.durationMins} mins
                        </Text>
                      </View>
                    </View>
                    <View style={styles.activityRightRow}>
                      <View style={styles.activityRight}>
                        <Text style={styles.activityVolume}>
                          {displayWeight(item.volume, getWeightUnit(user?.weightUnit), 0)}
                        </Text>
                        <Text style={styles.activityVolumeLabel}>
                          VOLUME ({getUnitLabel(getWeightUnit(user?.weightUnit))})
                        </Text>
                      </View>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={24}
                        color={SLATE_400}
                      />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.exercisesContainer}>
                      {isLoadingThis ? (
                        <View style={styles.exerciseLoadingRow}>
                          <ActivityIndicator size="small" color={ACCENT} />
                          <Text style={styles.exerciseLoadingText}>Loading exercises...</Text>
                        </View>
                      ) : exercises.length === 0 ? (
                        <Text style={styles.noExercisesText}>No exercises recorded</Text>
                      ) : (
                        exercises.map((ex, idx) => {
                          const detailTags = formatOptionalDetails(ex.optionalDetails);
                          return (
                            <View key={`${item.session.id}-${idx}`} style={styles.exerciseRow}>
                              <View style={styles.exerciseMainRow}>
                                <View style={styles.exerciseInfo}>
                                  <View style={styles.exerciseIconSmall}>
                                    <MaterialIcons name="fitness-center" size={14} color={ACCENT} />
                                  </View>
                                  <Text style={styles.exerciseName}>{ex.name}</Text>
                                </View>
                                <View style={styles.exerciseStats}>
                                  <Text style={styles.exerciseSetsText}>
                                    {ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}
                                  </Text>
                                  <Text style={styles.exerciseVolumeText}>
                                    {displayWeight(ex.totalVolume, getWeightUnit(user?.weightUnit), 0)} {getWeightUnit(user?.weightUnit)}
                                  </Text>
                                </View>
                              </View>
                              {detailTags.length > 0 && (
                                <View style={styles.exerciseDetailTags}>
                                  {detailTags.map((tag, tagIdx) => (
                                    <View key={tagIdx} style={styles.exerciseDetailTag}>
                                      <Text style={styles.exerciseDetailTagText}>{tag}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                      <Pressable
                        style={({ pressed }) => [
                          styles.viewDetailsButton,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={() => router.push(`/session/${item.session.id}`)}
                      >
                        <Text style={styles.viewDetailsText}>View Full Details</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={ACCENT} />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: IOS_BG },
  container: { paddingHorizontal: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: PERFORMANCE_BLUE,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingBottom: 96,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  userName: { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: -64,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: BrandColors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE_100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: SLATE_400,
  },
  statCardValue: { fontSize: 22, fontWeight: '700', color: DARK_GREY },
  statCardSub: { fontSize: 10, fontWeight: '500', color: SLATE_400, marginTop: 4 },

  readyCard: {
    backgroundColor: BrandColors.white,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLATE_100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  readyTitle: { fontSize: 18, fontWeight: '700', color: DARK_GREY, marginBottom: 16 },
  readyButtons: { gap: 12 },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  browseButton: {
    backgroundColor: SLATE_100,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
  },
  browseButtonPressed: { backgroundColor: '#E2E8F0' },
  browseButtonText: { color: DARK_GREY, fontSize: 14, fontWeight: '600' },
  buttonPressed: { opacity: 0.95 },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DARK_GREY },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1,
  },
  activityList: { gap: 12 },
  activityCardWrapper: {
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SLATE_100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  activityCardExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  activityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(10,29,55,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: { gap: 2, flex: 1 },
  recentRefreshSpinner: { marginVertical: 4 },
  activityName: { fontSize: 14, fontWeight: '700', color: DARK_GREY },
  activityMeta: { fontSize: 12, color: SLATE_400 },
  activityRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activityRight: { alignItems: 'flex-end' },
  activityVolume: { fontSize: 14, fontWeight: '700', color: DARK_GREY },
  activityVolumeLabel: { fontSize: 10, fontWeight: '700', color: SLATE_400, letterSpacing: 0.5 },

  exercisesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  exerciseLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  exerciseLoadingText: {
    fontSize: 13,
    color: SLATE_400,
  },
  noExercisesText: {
    fontSize: 13,
    color: SLATE_400,
    paddingVertical: 12,
    textAlign: 'center',
  },
  exerciseRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(10,29,55,0.02)',
    borderRadius: 8,
    gap: 6,
  },
  exerciseMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exerciseIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_GREY,
    flex: 1,
  },
  exerciseStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  exerciseSetsText: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_GREY,
  },
  exerciseVolumeText: {
    fontSize: 11,
    color: SLATE_400,
  },
  exerciseDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 38,
  },
  exerciseDetailTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 4,
  },
  exerciseDetailTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: ACCENT,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,53,0.08)',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
  },
});
