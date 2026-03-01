import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const SLATE_300 = '#CBD5E1';

export type SessionNavTab = 'rest' | 'history' | 'settings';

export interface SessionBottomNavProps {
  activeTab?: SessionNavTab;
  onRest?: () => void;
  onHistory?: () => void;
  onSettings?: () => void;
}

const TABS: Array<{
  key: SessionNavTab;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconFilled?: keyof typeof MaterialIcons.glyphMap;
}> = [
  { key: 'rest', label: 'Rest', icon: 'timer', iconFilled: 'timer' },
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export function SessionBottomNav({
  activeTab = 'rest',
  onRest,
  onHistory,
  onSettings,
}: SessionBottomNavProps) {
  const insets = useSafeAreaInsets();
  const handlers = {
    rest: onRest,
    history: onHistory,
    settings: onSettings,
  };

  return (
    <View style={[styles.nav, { paddingBottom: 16 + insets.bottom }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const onPress = handlers[tab.key];
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            onPress={onPress}
          >
            <MaterialIcons
              name={isActive && tab.iconFilled ? tab.iconFilled : tab.icon}
              size={24}
              color={isActive ? PERFORMANCE_BLUE : SLATE_300}
              {...(isActive && tab.key === 'rest' ? { style: { opacity: 1 } } : {})}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: SLATE_300,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: PERFORMANCE_BLUE,
  },
});
