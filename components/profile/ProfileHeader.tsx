import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export type ProfileHeaderProps = {
  displayName: string;
  subtitle?: string;
  onBackPress?: () => void;
};

export function ProfileHeader({
  displayName,
  subtitle = 'Offline Profile • Local Data Only',
  onBackPress,
}: ProfileHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {onBackPress ? (
          <Pressable
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={BrandColors.white} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
        <ThemedText style={styles.title}>Profile Settings</ThemedText>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.profileBlock}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <MaterialIcons
              name="account-circle"
              size={56}
              color={BrandColors.slate400}
            />
          </View>
        </View>
        <ThemedText style={styles.displayName}>{displayName || 'Guest'}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: BrandColors.navyDeep,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.white,
  },
  placeholder: {
    width: 40,
  },
  profileBlock: {
    alignItems: 'center',
    gap: 16,
  },
  avatarRow: {
    position: 'relative',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 9999,
    backgroundColor: BrandColors.navy,
    borderWidth: 4,
    borderColor: 'rgba(17, 82, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.white,
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.slate400,
  },
});
