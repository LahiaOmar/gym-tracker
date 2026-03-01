import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

export type PRBadgeVariant = 'star' | 'trending_up';

export interface PRBadgeProps {
  variant?: PRBadgeVariant;
}

export function PRBadge({ variant = 'star' }: PRBadgeProps) {
  const iconName = variant === 'trending_up' ? 'trending-up' : 'star';
  return (
    <View style={styles.badge}>
      <MaterialIcons name={iconName} size={10} color={BrandColors.performanceAccent} />
      <Text style={styles.text}>PR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: `${BrandColors.performanceAccent}1A`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.performanceAccent,
  },
});
