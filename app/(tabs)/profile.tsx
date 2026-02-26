import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useStorage } from '@/contexts/StorageContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady, setUser } = useStorage();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(user?.weightUnit ?? 'kg');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setWeightUnit(user.weightUnit);
    }
  }, [user?.id, user?.displayName, user?.weightUnit]);

  const handleSave = useCallback(async () => {
    if (!user || !repositories) return;
    await repositories.user.update(user.id, {
      displayName: displayName.trim() || 'Guest',
      weightUnit,
    });
    const updated = await repositories.user.getById(user.id);
    if (updated) setUser(updated);
  }, [user, repositories, displayName, weightUnit, setUser]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset data',
      'This will delete all your categories, custom exercises, and workout history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (!user || !repositories) return;
            try {
              const sessions = await repositories.workoutSession.list({ filter: { userId: user.id }, limit: 1000 });
              for (const s of sessions) {
                await repositories.workoutSession.delete(s.id);
              }
              const categories = await repositories.trainingCategory.list({ filter: { userId: user.id }, limit: 1000 });
              for (const c of categories) {
                await repositories.trainingCategory.delete(c.id);
              }
              const exercises = await repositories.exercise.list({ filter: { userId: user.id }, limit: 1000 });
              for (const e of exercises) {
                await repositories.exercise.delete(e.id);
              }
              Alert.alert('Done', 'Your data has been reset.');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Could not reset data.');
            }
          },
        },
      ]
    );
  }, [user, repositories]);

  if (!isReady || !user) {
    return null;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: 20 + insets.top, paddingBottom: 40 + insets.bottom },
      ]}
    >
      <ThemedText type="title">Profile</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Display name</ThemedText>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Guest"
          placeholderTextColor="#687076"
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Weight unit</ThemedText>
        <ThemedView style={styles.unitRow}>
          <Pressable
            style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('kg')}
          >
            <ThemedText style={weightUnit === 'kg' ? styles.unitButtonTextActive : undefined}>kg</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.unitButton, weightUnit === 'lb' && styles.unitButtonActive]}
            onPress={() => setWeightUnit('lb')}
          >
            <ThemedText style={weightUnit === 'lb' ? styles.unitButtonTextActive : undefined}>lb</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <ThemedText style={styles.saveButtonText}>Save</ThemedText>
      </Pressable>

      <ThemedView style={styles.dangerZone}>
        <ThemedText type="defaultSemiBold" style={styles.dangerTitle}>Danger zone</ThemedText>
        <Pressable style={styles.resetButton} onPress={handleReset}>
          <ThemedText style={styles.resetButtonText}>Reset all data</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    color: BrandColors.text,
  },
  unitRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  unitButtonActive: { backgroundColor: BrandColors.action, borderColor: BrandColors.action },
  unitButtonTextActive: { color: BrandColors.white, fontWeight: '600' },
  saveButton: {
    marginTop: 24,
    backgroundColor: BrandColors.action,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: BrandColors.white, fontSize: 16, fontWeight: '600' },
  dangerZone: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: BrandColors.border },
  dangerTitle: { color: BrandColors.danger },
  resetButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.danger,
  },
  resetButtonText: { color: BrandColors.danger, fontWeight: '600' },
});
