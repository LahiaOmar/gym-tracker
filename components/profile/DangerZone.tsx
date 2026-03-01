import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

export type DangerZoneProps = {
  message: string;
  buttonLabel: string;
  onPress: () => void;
};

export function DangerZone({
  message,
  buttonLabel,
  onPress,
}: DangerZoneProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? BrandColors.dangerBgDark : BrandColors.dangerBgLight;
  const borderColor = isDark
    ? BrandColors.dangerBorderDark
    : BrandColors.dangerBorderLight;

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Danger Zone</ThemedText>
      <View style={[styles.box, { backgroundColor: bgColor, borderColor }]}>
        <ThemedText
          style={[styles.message, isDark && { color: BrandColors.dangerTextDark }]}
        >
          {message}
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onPress}
        >
          <MaterialIcons
            name="delete-forever"
            size={18}
            color={BrandColors.white}
          />
          <ThemedText style={styles.buttonText}>{buttonLabel}</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: BrandColors.danger,
    marginBottom: 12,
    marginLeft: 8,
  },
  box: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  message: {
    fontSize: 12,
    color: BrandColors.danger,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
