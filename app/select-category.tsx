import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
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

const AVAILABLE_ICONS: MaterialIconName[] = [
  'fitness-center',
  'sports-gymnastics',
  'directions-run',
  'rowing',
  'accessibility-new',
  'self-improvement',
  'sports-martial-arts',
  'sports-kabaddi',
  'sports-handball',
  'sports-tennis',
  'sports-soccer',
  'sports-basketball',
  'sports-volleyball',
  'pool',
  'pedal-bike',
  'hiking',
  'downhill-skiing',
  'snowboarding',
  'surfing',
  'skateboarding',
  'sports-golf',
  'sports-baseball',
  'sports-hockey',
  'sports-rugby',
  'sports-cricket',
  'sports-mma',
  'sports-motorsports',
  'sports-esports',
  'emoji-events',
  'military-tech',
  'timer',
  'speed',
  'bolt',
  'whatshot',
  'local-fire-department',
  'favorite',
  'star',
];

export default function SelectCategoryScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { setActiveSessionId } = useActiveSession();
  const { user, repositories, isReady } = useStorage();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MaterialIconName>('fitness-center');

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

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleSelect = useCallback(
    async (category: TrainingCategory) => {
      if (!repositories || !user) return;
      try {
        const session = await repositories.workoutSession.create({
          userId: user.id,
          categoryId: category.id,
          startedAt: new Date().toISOString(),
          endedAt: null,
        });
        setActiveSessionId(session.id);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: '(tabs)',
                state: {
                  index: 1,
                  routes: [
                    { name: 'Home' },
                    { name: 'History' },
                    { name: 'Stats' },
                    { name: 'Profile' },
                  ],
                },
              },
            ],
          })
        );
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not start workout');
      }
    },
    [repositories, user, setActiveSessionId, navigation]
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
        icon: selectedIcon,
      });
      setCategories((prev) => [...prev, cat]);
      setNewName('');
      setSelectedIcon('fitness-center');
      setCreateModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not create category');
    } finally {
      setCreating(false);
    }
  }, [newName, repositories, user, selectedIcon]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleDeleteCategory = useCallback(
    async (category: TrainingCategory) => {
      if (!repositories) return;
      
      Alert.alert(
        'Delete Workout',
        `Are you sure you want to delete "${category.name}"? This will not delete your workout history.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await repositories.trainingCategory.delete(category.id);
                setCategories((prev) => prev.filter((c) => c.id !== category.id));
              } catch (e) {
                console.error(e);
                Alert.alert('Error', 'Could not delete category');
              }
            },
          },
        ]
      );
    },
    [repositories]
  );

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
            <Text style={styles.headerTitle}>Select Workout</Text>
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
            keyExtractor={(item) => item.id}
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
                      name={(item.icon as MaterialIconName) || 'fitness-center'}
                      size={28}
                      color={PERFORMANCE_BLUE}
                    />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(item);
                  }}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={22} color="#94A3B8" />
                </Pressable>
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

      {/* Create category modal */}
      {createModalVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={styles.modalBackdrop} onPress={() => setCreateModalVisible(false)} />
          <View style={[styles.modalCard, { marginTop: 80 + topPad }]}>
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

            <Text style={styles.iconSelectorLabel}>Select Icon</Text>
            <View style={styles.selectedIconPreview}>
              <View style={styles.selectedIconBox}>
                <MaterialIcons name={selectedIcon} size={32} color={PERFORMANCE_BLUE} />
              </View>
              <Text style={styles.selectedIconName}>{selectedIcon}</Text>
            </View>

            <FlatList
              data={AVAILABLE_ICONS}
              keyExtractor={(item) => item}
              numColumns={5}
              style={styles.iconGrid}
              contentContainerStyle={styles.iconGridContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: iconName }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.iconOption,
                    selectedIcon === iconName && styles.iconOptionSelected,
                    pressed && styles.iconOptionPressed,
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                >
                  <MaterialIcons
                    name={iconName}
                    size={24}
                    color={selectedIcon === iconName ? '#fff' : PERFORMANCE_BLUE}
                  />
                </Pressable>
              )}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, pressed && styles.modalBtnPressed]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewName('');
                  setSelectedIcon('fitness-center');
                }}
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
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
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
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    maxHeight: '70%',
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
  iconSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  selectedIconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  selectedIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 29, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  iconGrid: {
    maxHeight: 180,
    marginBottom: 16,
  },
  iconGridContent: {
    gap: 8,
  },
  iconOption: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '18%',
    margin: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 29, 55, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: PERFORMANCE_BLUE,
  },
  iconOptionPressed: {
    opacity: 0.7,
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
