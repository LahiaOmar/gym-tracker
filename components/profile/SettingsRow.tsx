import { StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export type SettingsRowProps = {
  icon: React.ReactNode;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  right: React.ReactNode;
  isLast?: boolean;
};

export function SettingsRow({
  icon,
  iconBgColor = BrandColors.primary + '1A',
  title,
  subtitle,
  right,
  isLast,
}: SettingsRowProps) {
  const borderColor = useThemeColor(
    { light: BrandColors.border, dark: BrandColors.slate800 },
    'border'
  );
  return (
    <View
      style={[
        styles.row,
        !isLast && [styles.rowBorder, { borderBottomColor: borderColor }],
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
        <View>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          )}
        </View>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: BrandColors.slate,
    marginTop: 2,
  },
  right: {
    marginLeft: 12,
  },
});
