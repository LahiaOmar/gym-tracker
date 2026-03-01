import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface ExerciseHighlightCardProps {
  title: string;
  bestSet: string;
  imageUri?: string | null;
  isPr?: boolean;
}

export function ExerciseHighlightCard({
  title,
  bestSet,
  imageUri,
  isPr = false,
}: ExerciseHighlightCardProps) {
  const rightIcon: ComponentProps<typeof MaterialIcons>['name'] = isPr
    ? 'trending-up'
    : 'check-circle';

  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons
              name="fitness-center"
              size={24}
              color={BrandColors.performanceBlue}
            />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.bestSet} numberOfLines={1}>
          Best: {bestSet}
        </Text>
      </View>
      <MaterialIcons
        name={rightIcon}
        size={24}
        color={isPr ? BrandColors.performanceAccent : BrandColors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: `${BrandColors.performanceBlue}0D`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.performanceBlue,
  },
  bestSet: {
    fontSize: 12,
    color: BrandColors.slate,
    marginTop: 2,
  },
});
