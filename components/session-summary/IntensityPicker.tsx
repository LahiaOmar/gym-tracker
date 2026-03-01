import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

const EMOJIS = ['😅', '🔥', '💀'] as const;
export type IntensityOption = (typeof EMOJIS)[number];

interface IntensityPickerProps {
  selected: IntensityOption | null;
  onSelect: (value: IntensityOption) => void;
}

export function IntensityPicker({ selected, onSelect }: IntensityPickerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>How was the intensity?</Text>
      <View style={styles.row}>
        {EMOJIS.map((emoji) => {
          const isSelected = selected === emoji;
          return (
            <Pressable
              key={emoji}
              style={({ pressed }) => [
                styles.emojiButton,
                isSelected && styles.emojiButtonSelected,
                pressed && styles.emojiButtonPressed,
              ]}
              onPress={() => onSelect(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: `${BrandColors.white}80`,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  question: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandColors.slate,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  emojiButtonSelected: {
    borderWidth: 2,
    borderColor: BrandColors.performanceAccent,
  },
  emojiButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.9 }],
  },
  emoji: {
    fontSize: 24,
  },
});
