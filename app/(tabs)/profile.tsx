import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Appearance,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DangerZone,
  ProfileHeader,
  SegmentedControl,
  SettingsRow,
  SettingsSection,
} from '@/components/profile';
import { BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStorage } from '@/contexts/StorageContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const { user, repositories, isReady, setUser } = useStorage();
  const colorScheme = useColorScheme();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(user?.weightUnit ?? 'kg');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const systemTheme = colorScheme ?? 'light';
  const [appearanceSelection, setAppearanceSelection] = useState<'light' | 'dark'>(systemTheme);
  const savedAppearanceRef = useRef<'light' | 'dark'>(systemTheme);
  const barBg = useThemeColor(
    { light: BrandColors.white, dark: BrandColors.navy },
    'card'
  );
  const barBorder = useThemeColor(
    { light: BrandColors.border, dark: BrandColors.slate },
    'border'
  );
  const handleAppearanceChange = useCallback((v: 'light' | 'dark') => {
    setAppearanceSelection(v);
    Appearance.setColorScheme(v);
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setWeightUnit(user.weightUnit);
    }
  }, [user?.id, user?.displayName, user?.weightUnit]);

  const appearance = appearanceSelection;
  const effectiveName = displayName.trim() || 'Guest';
  const appearanceChanged = appearanceSelection !== savedAppearanceRef.current;
  const hasChanges =
    user != null &&
    (effectiveName !== user.displayName ||
      weightUnit !== user.weightUnit ||
      appearanceChanged);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    if (!user || !repositories) return;
    setSaving(true);
    try {
      const name = displayName.trim() || 'Guest';
      await repositories.user.update(user.id, {
        displayName: name,
        weightUnit,
      });
      const updated = await repositories.user.getById(user.id);
      if (updated) setUser(updated);
      savedAppearanceRef.current = appearanceSelection;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }, [user, repositories, displayName, weightUnit, appearanceSelection, setUser]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset data',
      'Resetting your data will permanently delete all local workout history, routines, and custom exercises. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (!user || !repositories) return;
            try {
              const sessions = await repositories.workoutSession.list({
                filter: { userId: user.id },
                limit: 1000,
              });
              for (const s of sessions) {
                await repositories.workoutSession.delete(s.id);
              }
              const categories = await repositories.trainingCategory.list({
                filter: { userId: user.id },
                limit: 1000,
              });
              for (const c of categories) {
                await repositories.trainingCategory.delete(c.id);
              }
              const exercises = await repositories.exercise.list({
                filter: { userId: user.id },
                limit: 1000,
              });
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

  const displayLabel = displayName.trim() || 'Guest';

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 24 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          displayName={displayLabel}
          subtitle="Offline Profile • Local Data Only"
        />

        <View style={styles.content}>
          <SettingsSection title="Personalization">
            <SettingsRow
              icon={
                <MaterialIcons
                  name="badge"
                  size={22}
                  color={BrandColors.primary}
                />
              }
              iconBgColor={BrandColors.primary + '1A'}
              title="Display Name"
              subtitle="How you appear in summaries"
              right={
                <TextInput
                  style={[
                    styles.displayNameInput,
                    {
                      color: BrandColors.primary,
                    },
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Guest"
                  placeholderTextColor={BrandColors.slate}
                  maxLength={32}
                />
              }
              isLast={false}
            />
            <SettingsRow
              icon={
                <MaterialIcons
                  name="monitor-weight"
                  size={22}
                  color={BrandColors.action}
                />
              }
              iconBgColor={BrandColors.action + '1A'}
              title="Weight Unit"
              subtitle="Choose metric or imperial"
              right={
                <SegmentedControl
                  options={[
                    { value: 'kg', label: 'KG' },
                    { value: 'lb', label: 'LB' },
                  ]}
                  value={weightUnit}
                  onValueChange={(v) => setWeightUnit(v)}
                />
              }
              isLast
            />
          </SettingsSection>

          <SettingsSection title="App Preferences">
            <SettingsRow
              icon={
                <MaterialIcons
                  name="dark-mode"
                  size={22}
                  color="#6366F1"
                />
              }
              iconBgColor="#6366F11A"
              title="Appearance"
              subtitle="Light or Dark mode"
              right={
                <SegmentedControl
                  options={[
                    {
                      value: 'light',
                      label: 'Light',
                      icon: (
                        <MaterialIcons
                          name="light-mode"
                          size={16}
                          color={appearance === 'light' ? BrandColors.primary : BrandColors.slate}
                        />
                      ),
                    },
                    {
                      value: 'dark',
                      label: 'Dark',
                      icon: (
                        <MaterialIcons
                          name="dark-mode"
                          size={16}
                          color={appearance === 'dark' ? BrandColors.primary : BrandColors.slate}
                        />
                      ),
                    },
                  ]}
                  value={appearance}
                  onValueChange={(v) => handleAppearanceChange(v === 'light' ? 'light' : 'dark')}
                />
              }
              isLast
            />
          </SettingsSection>

          <DangerZone
            message="Resetting your data will permanently delete all local workout history, routines, and custom exercises. This action cannot be undone."
            buttonLabel="Reset All Data"
            onPress={handleReset}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.saveBar,
          {
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: barBg,
            borderTopColor: barBorder,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && hasChanges && !saving && styles.saveButtonPressed,
            (!hasChanges || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          <ThemedText style={styles.saveButtonText}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  content: {
    paddingTop: 24,
  },
  displayNameInput: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
    paddingVertical: 4,
  },
  saveBar: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    backgroundColor: BrandColors.action,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonPressed: { opacity: 0.95 },
  saveButtonDisabled: { opacity: 0.8 },
  saveButtonText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
