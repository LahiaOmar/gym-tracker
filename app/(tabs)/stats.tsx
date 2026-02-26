import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { useGlobalStats, useExerciseStats } from '@/hooks/useStats';
import type { Exercise } from '@/src/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StatsTabScreen() {
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const { weekVolume, monthVolume, sessionsThisWeek } = useGlobalStats(
    repositories,
    user?.id ?? null
  );
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { maxWeight, bestVolume } = useExerciseStats(
    repositories,
    user?.id ?? null,
    selectedExercise?.id ?? null
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: 20 + insets.top, paddingBottom: 40 + insets.bottom },
      ]}
    >
      <ThemedText type="title">Stats</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">This week</ThemedText>
        <ThemedText style={styles.detail}>
          Volume: {weekVolume.toLocaleString()} {unit}
        </ThemedText>
        <ThemedText style={styles.detail}>Sessions: {sessionsThisWeek}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">This month</ThemedText>
        <ThemedText style={styles.detail}>
          Volume: {monthVolume.toLocaleString()} {unit}
        </ThemedText>
      </ThemedView>

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
            <ThemedText style={styles.detail}>Max weight: {maxWeight} {unit}</ThemedText>
            <ThemedText style={styles.detail}>Best volume session: {bestVolume.toLocaleString()} {unit}</ThemedText>
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
  detail: { marginTop: 4, color: BrandColors.slate },
  input: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    color: BrandColors.text,
  },
  selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  clearText: { color: BrandColors.action },
  exerciseRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
});
