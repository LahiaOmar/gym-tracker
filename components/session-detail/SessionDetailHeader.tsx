import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

export interface SessionDetailHeaderProps {
  title: string;
  dateLabel: string;
  durationLabel: string;
  onBack: () => void;
  onShare?: () => void;
  onMore?: () => void;
}

export function SessionDetailHeader({
  title,
  dateLabel,
  durationLabel,
  onBack,
  onShare,
  onMore,
}: SessionDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(12, insets.top);

  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.topRow}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onBack}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={28} color={BrandColors.white} />
        </Pressable>
        <View style={styles.rightActions}>
          {onShare != null && (
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={onShare}
              accessibilityLabel="Share"
            >
              <MaterialIcons name="share" size={22} color={BrandColors.white} />
            </Pressable>
          )}
          {onMore != null && (
            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              onPress={onMore}
              accessibilityLabel="More options"
            >
              <MaterialIcons name="more-horiz" size={22} color={BrandColors.white} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="calendar-today" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={styles.metaText}>{dateLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="timer" size={18} color="rgba(255,255,255,0.6)" />
            <Text style={styles.metaText}>{durationLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: BrandColors.performanceBlue,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.white,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
});
