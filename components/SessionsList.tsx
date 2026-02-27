import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useSessions } from '@/contexts/SessionsContext';
import type { SessionItem } from '@/contexts/SessionsContext';
import { useStorage } from '@/contexts/StorageContext';

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

export function SessionsList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady } = useStorage();
  const { sessionItems: sessions, isLoading: loading, refetch } = useSessions();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = sessions.length > 0 && selectedIds.size === sessions.length;
  const selectAllOrNone = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sessions.map((i) => i.session.id)));
  }, [allSelected, sessions]);

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
              setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(item.session.id);
                return next;
              });
              await refetch(true);
            },
          },
        ]
      );
    },
    [repositories, refetch]
  );

  const requestDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteModalVisible(true);
  }, [selectedIds.size]);

  const confirmDeleteSelected = useCallback(async () => {
    if (!repositories || selectedIds.size === 0) {
      setDeleteModalVisible(false);
      return;
    }
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await repositories.workoutSession.delete(id);
    }
    setSelectedIds(new Set());
    setDeleteModalVisible(false);
    await refetch(true);
  }, [repositories, selectedIds, refetch]);

  if (!isReady || loading) {
    return (
      <View style={[styles.centered, { backgroundColor: IOS_BG }]}>
        <ActivityIndicator size="large" color={BrandColors.performanceAccent} />
      </View>
    );
  }

  const paddingTop = 16 + insets.top;
  const paddingBottom = 40 + insets.bottom;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop, paddingBottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Last Sessions</Text>
      <Text style={styles.subtitle}>Tap a session to view details</Text>
      {sessions.length > 0 && (
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.cardPressed]}
            onPress={selectAllOrNone}
          >
            <Text style={styles.actionBtnText}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </Pressable>
          {selectedIds.size > 0 && (
            <Pressable
              style={({ pressed }) => [styles.deleteSelectedBtn, pressed && styles.cardPressed]}
              onPress={requestDeleteSelected}
            >
              <MaterialIcons name="delete-outline" size={18} color={BrandColors.danger} />
              <Text style={styles.deleteSelectedText}>
                Delete {selectedIds.size} session{selectedIds.size !== 1 ? 's' : ''}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.list}>
        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="fitness-center" size={40} color={SLATE_400} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Start a workout from Home</Text>
          </View>
        ) : (
          sessions.map((item) => {
            const isSelected = selectedIds.has(item.session.id);
            return (
              <View key={item.session.id} style={styles.card}>
                <Pressable
                  style={({ pressed }) => [
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => toggleSelection(item.session.id)}
                >
                  {isSelected ? (
                    <MaterialIcons name="check-box" size={24} color={BrandColors.performanceAccent} />
                  ) : (
                    <MaterialIcons name="check-box-outline-blank" size={24} color={SLATE_400} />
                  )}
                </Pressable>
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
            );
          })
        )}
      </View>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Delete sessions?</Text>
            <Text style={styles.modalMessage}>
              Delete {selectedIds.size} session{selectedIds.size !== 1 ? 's' : ''}? This cannot be
              undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.cardPressed]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalConfirmBtn, pressed && styles.cardPressed]}
                onPress={confirmDeleteSelected}
              >
                <Text style={styles.modalConfirmText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: IOS_BG },
  container: { paddingHorizontal: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: DARK_GREY, marginBottom: 4 },
  subtitle: { fontSize: 14, color: SLATE_400, marginBottom: 20 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.performanceAccent,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.danger,
  },
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
  checkbox: {
    padding: 4,
    marginRight: 4,
  },
  checkboxSelected: {},
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: BrandColors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK_GREY,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: SLATE_400,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GREY,
  },
  modalConfirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: BrandColors.danger,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
