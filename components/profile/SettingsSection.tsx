import { StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export type SettingsSectionProps = {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  titleColor,
  children,
}: SettingsSectionProps) {
  const cardBg = useThemeColor(
    { light: BrandColors.white, dark: BrandColors.slate900 },
    'card'
  );
  const borderColor = useThemeColor(
    { light: BrandColors.border, dark: BrandColors.slate800 },
    'border'
  );
  const labelColor = titleColor ?? BrandColors.slate;

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: labelColor }]}>
        {title}
      </ThemedText>
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
});
