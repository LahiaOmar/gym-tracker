import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
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
import {
  formatWeekLabel,
  getCurrentWeekStart,
  getRangeForPeriod,
} from '@/utils/period';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const SCREEN_PADDING = 20 * 2;
const CARD_PADDING = 16 * 2;
const CHART_WIDTH = Dimensions.get('window').width - SCREEN_PADDING - CARD_PADDING;
const CHART_HEIGHT = 200;

export default function StatsTabScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const labelColor = useThemeColor({}, 'textSecondary');
  const { user, repositories, isReady } = useStorage();
  const [selectedWeekStart, setSelectedWeekStart] = useState(getCurrentWeekStart());
  const [valuePickerVisible, setValuePickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());
  const latestPickerDateRef = useRef<Date>(new Date());

  const getInitialPickerDate = useCallback((): Date => {
    const [y, m, d] = selectedWeekStart.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedWeekStart]);

  const applyPickerDate = useCallback((date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    setSelectedWeekStart(
      `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
    );
  }, []);

  const handleOpenPicker = useCallback(() => {
    const initial = getInitialPickerDate();
    setPickerDate(initial);
    latestPickerDateRef.current = initial;
    setValuePickerVisible(true);
  }, [getInitialPickerDate]);

  const handlePickerChange = useCallback(
    (event: { type: string }, date?: Date) => {
      if (date != null) {
        setPickerDate(date);
        latestPickerDateRef.current = date;
      }
      if (Platform.OS === 'android') {
        if (event.type === 'set') {
          if (date != null) applyPickerDate(date);
          setValuePickerVisible(false);
        } else if (event.type === 'dismissed') {
          setValuePickerVisible(false);
        }
      }
    },
    [applyPickerDate]
  );

  const handleBackdropPress = useCallback(() => {
    applyPickerDate(latestPickerDateRef.current);
    setValuePickerVisible(false);
  }, [applyPickerDate]);

  const minDate = useMemo(() => new Date(2020, 0, 1), []);
  const maxDate = useMemo(() => new Date(), []);

  const { from, to } = useMemo(
    () => getRangeForPeriod('week', selectedWeekStart),
    [selectedWeekStart]
  );

  const chartConfig = {
    backgroundColor: cardBg,
    backgroundGradientFrom: cardBg,
    backgroundGradientTo: colorScheme === 'dark' ? BrandColors.slate900 : BrandColors.backgroundSoft,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
    labelColor: () => labelColor,
    style: { borderRadius: 12, paddingRight: 8 },
    propsForLabels: { fontSize: 10 },
  };

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
    from,
    to
  );
  const { data: durationByWeek } = useSessionDurationByWeek(
    repositories,
    user?.id ?? null,
    from,
    to
  );
  const { data: volumeByCategory } = useVolumeByCategory(
    repositories,
    user?.id ?? null,
    from,
    to
  );
  const { data: topExercises } = useTopExercises(
    repositories,
    user?.id ?? null,
    from,
    to,
    8
  );
  const { data: activityHeatmap } = useActivityHeatmap(
    repositories,
    user?.id ?? null,
    from,
    to
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
    from,
    to
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
        <ThemedView style={[styles.card, styles.cardHalf, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="defaultSemiBold">This week</ThemedText>
          <ThemedText style={styles.detail}>
            Volume: {weekVolume.toLocaleString()} {unit}
          </ThemedText>
          <ThemedText style={styles.detail}>Sessions: {sessionsThisWeek}</ThemedText>
          <ThemedText style={styles.detail}>
            Time: {Math.floor(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m
          </ThemedText>
        </ThemedView>
        <ThemedView style={[styles.card, styles.cardHalf, { backgroundColor: cardBg, borderColor }]}>
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
        <Pressable
          style={[styles.periodValueBtn, { borderColor, backgroundColor: cardBg }]}
          onPress={handleOpenPicker}
        >
          <ThemedText>{formatWeekLabel(selectedWeekStart)}</ThemedText>
        </Pressable>
      </View>

      <Modal
        visible={valuePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleBackdropPress}>
          <View
            style={[styles.modalContent, { backgroundColor: cardBg, borderColor }]}
            onStartShouldSetResponder={() => true}
          >
            {valuePickerVisible && (
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={handlePickerChange}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Volume over time */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="defaultSemiBold">Volume by category</ThemedText>
          {volumeByCategory.map((c) => (
            <View key={c.categoryName} style={styles.barRow}>
              <ThemedText style={[styles.barLabel, { color: textColor }]} numberOfLines={1}>
                {c.categoryName}
              </ThemedText>
              <View style={[styles.barTrack, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(c.volume / maxCategoryVol) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText style={[styles.barValue, { color: labelColor }]}>
                {c.volume.toLocaleString()} {unit}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {/* Top exercises */}
      {topExercises.length > 0 && (
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText type="defaultSemiBold">Top exercises by volume</ThemedText>
          {topExercises.map((e) => (
            <View key={e.exerciseName} style={styles.barRow}>
              <ThemedText style={[styles.barLabel, { color: textColor }]} numberOfLines={1}>
                {e.exerciseName}
              </ThemedText>
              <View style={[styles.barTrack, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(e.volume / maxVolumeForBar) * 100}%` },
                  ]}
                />
              </View>
              <ThemedText style={[styles.barValue, { color: labelColor }]}>
                {e.volume.toLocaleString()} {unit} ({e.sessionCount})
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      {/* Activity heatmap (simple grid) */}
      {activityHeatmap.length > 0 && (
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
          <ThemedText style={styles.heatmapLegend}>
            Days in period • darker = more sessions
          </ThemedText>
        </ThemedView>
      )}

      {/* Exercise stats + progress chart */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
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
    overflow: 'hidden',
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
  periodValueBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
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
  barLabel: { flex: 1, fontSize: 12 },
  barTrack: {
    flex: 1.2,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: BrandColors.action,
    borderRadius: 4,
  },
  barValue: { fontSize: 11, minWidth: 70, textAlign: 'right' },
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
