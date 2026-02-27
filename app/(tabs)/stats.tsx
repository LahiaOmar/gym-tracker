import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import {
  useGlobalStats,
  useExerciseStats,
  useTimeBucketedStats,
  useExerciseProgress,
  useVolumeByCategory,
  useTopExercises,
  useSessionDurationByWeek,
  useActivityHeatmap,
} from '@/hooks/useStats';
import type { Exercise } from '@/src/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const CHART_WIDTH = Dimensions.get('window').width - 40;
const CHART_HEIGHT = 200;

const chartConfig = {
  backgroundColor: BrandColors.white,
  backgroundGradientFrom: BrandColors.white,
  backgroundGradientTo: BrandColors.backgroundSoft,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
  labelColor: () => BrandColors.slate,
  style: { borderRadius: 12, paddingRight: 8 },
  propsForLabels: { fontSize: 10 },
};

export default function StatsTabScreen() {
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const [periodWeeks, setPeriodWeeks] = useState(4);

  const {
    weekVolume,
    monthVolume,
    sessionsThisWeek,
    monthSessionsCount,
    thisWeekMinutes,
    streak,
  } = useGlobalStats(repositories, user?.id ?? null);

  const { volumeByWeek, sessionsByWeek } = useTimeBucketedStats(
    repositories,
    user?.id ?? null,
    periodWeeks
  );
  const { data: durationByWeek } = useSessionDurationByWeek(
    repositories,
    user?.id ?? null,
    periodWeeks
  );
  const { data: volumeByCategory } = useVolumeByCategory(
    repositories,
    user?.id ?? null,
    periodWeeks
  );
  const { data: topExercises } = useTopExercises(
    repositories,
    user?.id ?? null,
    periodWeeks,
    8
  );
  const { data: activityHeatmap } = useActivityHeatmap(
    repositories,
    user?.id ?? null,
    periodWeeks
  );

  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { maxWeight, bestVolume } = useExerciseStats(
    repositories,
    user?.id ?? null,
    selectedExercise?.id ?? null
  );
  const { dataPoints: exerciseProgress } = useExerciseProgress(
    repositories,
    user?.id ?? null,
    selectedExercise?.id ?? null,
    periodWeeks
  );

  const loadExercises = useCallback(async () => {
    if (!repositories || !user) return;
    const builtIn = await repositories.exercise.list({
      filter: { userId: null, isBuiltIn: true },
      limit: 200,
    });
    const custom = await repositories.exercise.list({
      filter: { userId: user.id },
      limit: 200,
    });
    const combined = [...builtIn, ...custom.filter((e) => !e.isBuiltIn)];
    const search = exerciseSearch.trim().toLowerCase();
    const filtered = search
      ? combined.filter((e) => e.name.toLowerCase().includes(search))
      : combined;
    setExerciseList(filtered);
  }, [repositories, user, exerciseSearch]);

  useEffect(() => {
    if (isReady && user && repositories) loadExercises();
  }, [isReady, user?.id, repositories, exerciseSearch, loadExercises]);

  if (!isReady) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const unit = user?.weightUnit ?? 'kg';

  const volumeChartData = {
    labels: volumeByWeek.map((p) => p.label),
    datasets: [{ data: volumeByWeek.length ? volumeByWeek.map((p) => p.value) : [0] }],
  };
  const sessionsChartData = {
    labels: sessionsByWeek.map((p) => p.label),
    datasets: [{ data: sessionsByWeek.length ? sessionsByWeek.map((p) => p.value) : [0] }],
  };
  const durationChartData = {
    labels: durationByWeek.map((p) => p.label),
    datasets: [{ data: durationByWeek.length ? durationByWeek.map((p) => p.value) : [0] }],
  };
  const exerciseProgressLabels = exerciseProgress.map((p) => p.date.slice(5));
  const exerciseProgressData = {
    labels: exerciseProgressLabels.length ? exerciseProgressLabels : [''],
    datasets: [
      {
        data: exerciseProgress.length ? exerciseProgress.map((p) => p.maxWeight) : [0],
      },
    ],
  };

  const maxVolumeForBar = Math.max(...topExercises.map((e) => e.volume), 1);
  const maxCategoryVol = Math.max(...volumeByCategory.map((c) => c.volume), 1);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: 20 + insets.top, paddingBottom: 40 + insets.bottom },
      ]}
    >
      <ThemedText type="title">Stats</ThemedText>

      {/* Summary cards */}
      <View style={styles.cardsRow}>
        <ThemedView style={[styles.card, styles.cardHalf]}>
          <ThemedText type="defaultSemiBold">This week</ThemedText>
          <ThemedText style={styles.detail}>
            Volume: {weekVolume.toLocaleString()} {unit}
          </ThemedText>
          <ThemedText style={styles.detail}>Sessions: {sessionsThisWeek}</ThemedText>
          <ThemedText style={styles.detail}>
            Time: {Math.floor(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m
          </ThemedText>
        </ThemedView>
        <ThemedView style={[styles.card, styles.cardHalf]}>
          <ThemedText type="defaultSemiBold">This month</ThemedText>
          <ThemedText style={styles.detail}>
            Volume: {monthVolume.toLocaleString()} {unit}
          </ThemedText>
          <ThemedText style={styles.detail}>Sessions: {monthSessionsCount}</ThemedText>
          <ThemedText style={styles.detail}>Streak: {streak} days</ThemedText>
        </ThemedView>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        <ThemedText type="defaultSemiBold">Period</ThemedText>
        <View style={styles.periodButtons}>
          <Pressable
            style={[styles.periodBtn, periodWeeks === 4 && styles.periodBtnActive]}
            onPress={() => setPeriodWeeks(4)}
          >
            <ThemedText style={periodWeeks === 4 ? styles.periodBtnTextActive : undefined}>
              4 weeks
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.periodBtn, periodWeeks === 12 && styles.periodBtnActive]}
            onPress={() => setPeriodWeeks(12)}
          >
            <ThemedText style={periodWeeks === 12 ? styles.periodBtnTextActive : undefined}>
              12 weeks
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Volume over time */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Volume over time</ThemedText>
        {volumeByWeek.length > 0 ? (
          <LineChart
            data={volumeChartData}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterShadow={false}
          />
        ) : (
          <ThemedText style={styles.emptyText}>No volume data in this period</ThemedText>
        )}
      </ThemedView>

      {/* Sessions per week */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Sessions per week</ThemedText>
        {sessionsByWeek.length > 0 ? (
          <BarChart
            data={sessionsChartData}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            style={styles.chart}
            showBarTops={false}
            fromZero
          />
        ) : (
          <ThemedText style={styles.emptyText}>No sessions in this period</ThemedText>
        )}
      </ThemedView>

      {/* Session duration over time */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Training time per week (min)</ThemedText>
        {durationByWeek.length > 0 ? (
          <BarChart
            data={durationChartData}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            style={styles.chart}
            showBarTops={false}
            fromZero
          />
        ) : (
          <ThemedText style={styles.emptyText}>No duration data in this period</ThemedText>
        )}
      </ThemedView>

      {/* Volume by category */}
      {volumeByCategory.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Volume by category</ThemedText>
          {volumeByCategory.map((c) => (
            <View key={c.categoryName} style={styles.barRow}>
              <ThemedText style={styles.barLabel} numberOfLines={1}>
                {c.categoryName}
              </ThemedText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(c.volume / maxCategoryVol) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText style={styles.barValue}>
                {c.volume.toLocaleString()} {unit}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {/* Top exercises */}
      {topExercises.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Top exercises by volume</ThemedText>
          {topExercises.map((e) => (
            <View key={e.exerciseName} style={styles.barRow}>
              <ThemedText style={styles.barLabel} numberOfLines={1}>
                {e.exerciseName}
              </ThemedText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(e.volume / maxVolumeForBar) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText style={styles.barValue}>
                {e.volume.toLocaleString()} {unit} ({e.sessionCount})
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {/* Activity heatmap (simple grid) */}
      {activityHeatmap.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">Activity</ThemedText>
          <View style={styles.heatmapGrid}>
            {activityHeatmap.slice(-28).map((d) => (
              <View
                key={d.date}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor:
                      d.sessions === 0
                        ? BrandColors.border
                        : d.sessions >= 2
                          ? BrandColors.action
                          : BrandColors.performanceAccent,
                    opacity: d.sessions === 0 ? 0.4 : 0.6 + d.sessions * 0.2,
                  },
                ]}
              />
            ))}
          </View>
          <ThemedText style={styles.heatmapLegend}>Last 28 days • darker = more sessions</ThemedText>
        </ThemedView>
      )}

      {/* Exercise stats + progress chart */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Exercise stats</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Search exercise"
          placeholderTextColor="#687076"
          value={exerciseSearch}
          onChangeText={setExerciseSearch}
        />
        {selectedExercise ? (
          <ThemedView style={styles.selectedRow}>
            <ThemedText>{selectedExercise.name}</ThemedText>
            <Pressable onPress={() => setSelectedExercise(null)}>
              <ThemedText style={styles.clearText}>Clear</ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}
        {selectedExercise ? (
          <>
            <ThemedText style={styles.detail}>
              Max weight: {maxWeight} {unit}
            </ThemedText>
            <ThemedText style={styles.detail}>
              Best volume session: {bestVolume.toLocaleString()} {unit}
            </ThemedText>
            {exerciseProgress.length > 0 && (
              <>
                <ThemedText style={styles.chartTitle}>Max weight over time</ThemedText>
                <LineChart
                  data={exerciseProgressData}
                  width={CHART_WIDTH}
                  height={CHART_HEIGHT}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                  withOuterShadow={false}
                />
              </>
            )}
          </>
        ) : (
          <FlatList
            data={exerciseList.slice(0, 8)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.exerciseRow}
                onPress={() => setSelectedExercise(item)}
              >
                <ThemedText>{item.name}</ThemedText>
              </Pressable>
            )}
          />
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cardHalf: { flex: 1 },
  detail: { marginTop: 4, color: BrandColors.slate },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  periodButtons: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  periodBtnActive: { backgroundColor: BrandColors.action, borderColor: BrandColors.action },
  periodBtnTextActive: { color: BrandColors.white },
  chart: { marginTop: 8, borderRadius: 12 },
  chartTitle: { marginTop: 12, marginBottom: 4, color: BrandColors.slate },
  emptyText: { marginTop: 12, color: BrandColors.slate },
  input: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    color: BrandColors.text,
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  clearText: { color: BrandColors.action },
  exerciseRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  barLabel: { flex: 1, fontSize: 12, color: BrandColors.text },
  barTrack: {
    flex: 1.2,
    height: 8,
    backgroundColor: BrandColors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: BrandColors.action,
    borderRadius: 4,
  },
  barValue: { fontSize: 11, color: BrandColors.slate, minWidth: 70, textAlign: 'right' },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
  },
  heatmapCell: {
    width: (CHART_WIDTH - 24) / 7,
    height: 16,
    borderRadius: 2,
  },
  heatmapLegend: { marginTop: 8, fontSize: 11, color: BrandColors.slate },
});
