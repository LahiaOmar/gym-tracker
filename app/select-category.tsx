import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useActiveSession } from '@/contexts/ActiveSessionContext';
import { useStorage } from '@/contexts/StorageContext';
import type { TrainingCategory } from '@/src/domain';
import { generateId } from '@/src/adapters/sqlite/helpers';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const ACCENT = BrandColors.performanceAccent;
const IOS_BG = BrandColors.iosBg;

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Default categories shown in the design with icon and example exercises. */
const DEFAULT_CATEGORY_DEFS: Array<{
  name: string;
  icon: MaterialIconName;
  subtitle: string;
}> = [
  { name: 'Chest', icon: 'fitness-center', subtitle: 'Bench Press, Flys, Push-ups' },
  { name: 'Back', icon: 'rowing', subtitle: 'Deadlifts, Rows, Pull-ups' },
  { name: 'Legs', icon: 'directions-run', subtitle: 'Squats, Lunges, Leg Press' },
  { name: 'Shoulders', icon: 'accessibility-new', subtitle: 'Overhead Press, Lateral Raises' },
  { name: 'Arms', icon: 'sports-gymnastics', subtitle: 'Bicep Curls, Skullcrushers' },
  { name: 'Core', icon: 'self-improvement', subtitle: 'Planks, Crunches, Leg Raises' },
];

type CategoryItem =
  | { type: 'default'; name: string; icon: MaterialIconName; subtitle: string; categoryId: string | null }
  | { type: 'custom'; name: string; categoryId: string };

function getCategoryDisplayList(
  defaults: typeof DEFAULT_CATEGORY_DEFS,
  dbCategories: TrainingCategory[]
): CategoryItem[] {
  const byName = new Map(dbCategories.map((c) => [c.name, c]));
  const result: CategoryItem[] = [];
  for (const d of defaults) {
    const existing = byName.get(d.name);
    result.push({
      type: 'default',
      name: d.name,
      icon: d.icon,
      subtitle: d.subtitle,
      categoryId: existing?.id ?? null,
    });
  }
  for (const c of dbCategories) {
    if (!defaults.some((d) => d.name === c.name)) {
      result.push({ type: 'custom', name: c.name, categoryId: c.id });
    }
  }
  return result;
}

export default function SelectCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setActiveSessionId } = useActiveSession();
  const { user, repositories, isReady } = useStorage();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    if (!repositories || !user) return;
    const list = await repositories.trainingCategory.list({ filter: { userId: user.id } });
    setCategories(list);
  }, [repositories, user]);

  useEffect(() => {
    if (isReady && user && repositories) {
      setLoading(true);
      load().finally(() => setLoading(false));
    }
  }, [isReady, user?.id, repositories, load]);

  const displayList = useMemo(
    () => getCategoryDisplayList(DEFAULT_CATEGORY_DEFS, categories),
    [categories]
  );

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayList;
    return displayList.filter((item) => item.name.toLowerCase().includes(q));
  }, [displayList, search]);

  const handleSelect = useCallback(
    async (item: CategoryItem) => {
      if (!repositories || !user) return;
      let categoryId = item.categoryId;
      if (item.type === 'default' && !categoryId) {
        try {
          const created = await repositories.trainingCategory.create({
            id: generateId(),
            userId: user.id,
            name: item.name,
          });
          categoryId = created.id;
          setCategories((prev) => [...prev, created]);
        } catch (e) {
          console.error(e);
          Alert.alert('Error', 'Could not create category');
          return;
        }
      }
      if (!categoryId) return;
      try {
        const session = await repositories.workoutSession.create({
          userId: user.id,
          categoryId,
          startedAt: new Date().toISOString(),
          endedAt: null,
        });
        setActiveSessionId(session.id);
        router.replace('/(tabs)/session');
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not start workout');
      }
    },
    [repositories, user, setActiveSessionId, router]
  );

  const handleCreateCategory = useCallback(async () => {
    const name = newName.trim();
    if (!name || !repositories || !user) return;
    setCreating(true);
    try {
      const cat = await repositories.trainingCategory.create({
        id: generateId(),
        userId: user.id,
        name,
      });
      setCategories((prev) => [...prev, cat]);
      setNewName('');
      setCreateModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not create category');
    } finally {
      setCreating(false);
    }
  }, [newName, repositories, user]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!isReady) {
    return (
      <View style={[styles.centered, styles.screen]}>
        <ActivityIndicator size="large" color={PERFORMANCE_BLUE} />
      </View>
    );
  }

  const topPad = Platform.OS === 'ios' ? insets.top : 20 + insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: IOS_BG }]}>
      {/* Custom header */}
      <View style={[styles.header, { paddingTop: 16 + topPad }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            hitSlop={12}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Select Category</Text>
          </View>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PERFORMANCE_BLUE} />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.type === 'default' ? `default-${item.name}` : `custom-${item.categoryId}`}
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.cardInner}>
                  <View style={styles.iconBox}>
                    <MaterialIcons
                      name={item.type === 'default' ? item.icon : 'fitness-center'}
                      size={28}
                      color={PERFORMANCE_BLUE}
                    />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.type === 'default' ? (
                      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
              </Pressable>
            )}
          />

          {/* FAB */}
          <View style={[styles.fabWrap, { bottom: 24 + insets.bottom }]}>
            <Pressable
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
              onPress={() => setCreateModalVisible(true)}
            >
              <MaterialIcons name="add" size={28} color="#fff" />
            </Pressable>
          </View>
        </>
      )}

      {/* Create category modal (simplified: Alert for now to match MVP) */}
      {createModalVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCreateModalVisible(false)} />
          <View style={[styles.modalCard, { marginTop: 120 + topPad }]}>
            <Text style={styles.modalTitle}>Create Custom Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New category name"
              placeholderTextColor="#64748B"
              value={newName}
              onChangeText={setNewName}
              editable={!creating}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, pressed && styles.modalBtnPressed]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtnAccent,
                  (!newName.trim() || creating) && styles.modalBtnDisabled,
                  pressed && styles.modalBtnPressed,
                ]}
                onPress={handleCreateCategory}
                disabled={!newName.trim() || creating}
              >
                <Text style={styles.modalBtnAccentLabel}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: PERFORMANCE_BLUE,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4, minWidth: 32 },
  backBtnPressed: { opacity: 0.8 },
  headerTitleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cancelBtn: { padding: 4, minWidth: 60, alignItems: 'flex-end' },
  cancelBtnPressed: { opacity: 0.8 },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingLeft: 12,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 14,
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 29, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PERFORMANCE_BLUE,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  fabWrap: {
    position: 'absolute',
    right: 24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.9 }],
  },
  modalCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PERFORMANCE_BLUE,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.text,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalBtn: { padding: 8 },
  modalBtnLabel: { fontSize: 16, color: BrandColors.slate },
  modalBtnAccent: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnAccentLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnPressed: { opacity: 0.8 },
});
