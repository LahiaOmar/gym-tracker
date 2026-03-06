import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

interface SummaryHeaderProps {
  title: string;
  subtitle: string;
}

export function SummaryHeader({ title, subtitle }: SummaryHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(16, insets.top) + 24 }]}>
      <View style={styles.glow} />
      <View style={styles.iconWrap}>
        <MaterialIcons
          name="emoji-events"
          size={72}
          color={BrandColors.performanceAccent}
          style={styles.trophyIcon}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: BrandColors.performanceBlue,
    paddingBottom: 80,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: BrandColors.performanceAccent,
    opacity: 0.1,
  },
  iconWrap: {
    marginBottom: 24,
  },
  trophyIcon: {
    ...Platform.select({
      ios: {
        shadowColor: BrandColors.performanceAccent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
});
