import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { setVolume } from '@/src/domain';
import type { WorkoutSession } from '@/src/domain';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
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

function getSessionDurationMins(session: WorkoutSession): number {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : start;
  return Math.round((end - start) / 60000);
}

type SessionItem = {
  session: WorkoutSession;
  categoryName: string;
  durationMins: number;
  volume: number;
};

export default function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!repositories || !user) return;
    const list = await repositories.workoutSession.list({
      filter: { userId: user.id },
      limit: 100,
      sort: { field: 'startedAt', direction: 'desc' },
    });
    const items: SessionItem[] = [];
    for (const session of list) {
      const category = await repositories.trainingCategory.getById(session.categoryId);
      const exercises = await repositories.workoutExercise.list({
        filter: { sessionId: session.id },
      });
      let volume = 0;
      for (const we of exercises) {
        const sets = await repositories.workoutSet.list({
          filter: { workoutExerciseId: we.id },
        });
        for (const set of sets) volume += setVolume(set);
      }
      items.push({
        session,
        categoryName: category?.name ?? 'Workout',
        durationMins: getSessionDurationMins(session),
        volume,
      });
    }
    setSessions(items);
  }, [repositories, user]);

  useEffect(() => {
    if (isReady && user && repositories) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isReady, user?.id, repositories, load]);

  const handleRemoveSession = useCallback(
    (item: SessionItem) => {
      Alert.alert(
        'Remove session',
        `Remove "${item.categoryName}" from ${formatRelativeDate(item.session.startedAt)}? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (!repositories) return;
              await repositories.workoutSession.delete(item.session.id);
              setSessions((prev) => prev.filter((i) => i.session.id !== item.session.id));
            },
          },
        ]
      );
    },
    [repositories]
  );

  if (!isReady || loading) {
    return (
      <View style={[styles.centered, { backgroundColor: IOS_BG }]}>
        <ActivityIndicator size="large" color={BrandColors.performanceAccent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: 16 + insets.top, paddingBottom: 40 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Last Sessions</Text>
      <Text style={styles.subtitle}>Tap a session to view details</Text>
      <View style={styles.list}>
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="fitness-center" size={40} color={SLATE_400} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Start a workout from Home</Text>
          </View>
        ) : (
          sessions.map((item) => (
            <View key={item.session.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardInner, pressed && styles.cardPressed]}
                onPress={() => router.push(`/session/${item.session.id}`)}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.iconWrap}>
                    <MaterialIcons name="fitness-center" size={24} color={PERFORMANCE_BLUE} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{item.categoryName}</Text>
                    <Text style={styles.cardMeta}>
                      {formatRelativeDate(item.session.startedAt)} • {item.durationMins} mins
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardVolume}>{item.volume.toLocaleString()}</Text>
                  <Text style={styles.cardVolumeLabel}>
                    VOL ({user?.weightUnit?.toUpperCase() ?? 'KG'})
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.removeBtn, pressed && styles.cardPressed]}
                onPress={() => handleRemoveSession(item)}
                hitSlop={8}
              >
                <MaterialIcons name="delete-outline" size={22} color={BrandColors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: IOS_BG },
  container: { paddingHorizontal: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: DARK_GREY, marginBottom: 4 },
  subtitle: { fontSize: 14, color: SLATE_400, marginBottom: 20 },
  list: { gap: 12 },
  emptyCard: {
    backgroundColor: BrandColors.white,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SLATE_100,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: DARK_GREY, marginTop: 12 },
  emptySub: { fontSize: 14, color: SLATE_400, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    paddingRight: 8,
    paddingVertical: 8,
    paddingLeft: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SLATE_100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cardPressed: { opacity: 0.95 },
  removeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(10,29,55,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { gap: 2 },
  cardName: { fontSize: 14, fontWeight: '700', color: DARK_GREY },
  cardMeta: { fontSize: 12, color: SLATE_400 },
  cardRight: { alignItems: 'flex-end' },
  cardVolume: { fontSize: 14, fontWeight: '700', color: DARK_GREY },
  cardVolumeLabel: { fontSize: 10, fontWeight: '700', color: SLATE_400, letterSpacing: 0.5 },
});
