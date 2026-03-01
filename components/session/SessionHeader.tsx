import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrandColors } from '@/constants/theme';

const PERFORMANCE_BLUE = BrandColors.performanceBlue;
const ACCENT = BrandColors.performanceAccent;

export interface TimerParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function formatElapsedToParts(totalSeconds: number): TimerParts {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function TimerUnit({
  value,
  label,
  highlighted,
}: {
  value: number;
  label: string;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.timerUnit, highlighted && styles.timerUnitHighlighted]}>
      <Text style={[styles.timerValue, highlighted && styles.timerValueHighlighted]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={styles.timerLabel}>{label}</Text>
    </View>
  );
}

export interface SessionHeaderProps {
  title: string;
  timerParts: TimerParts;
  onFinish: () => void;
}

export function SessionHeader({ title, timerParts, onFinish }: SessionHeaderProps) {
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0.75);

  useEffect(() => {
    pingScale.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 1000 }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    pingOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(0.75, { duration: 0 })
      ),
      -1,
      false
    );
  }, [pingScale, pingOpacity]);

  const pingRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: pingOpacity.value,
  }));

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <MaterialIcons name="fitness-center" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.liveRow}>
              <View style={styles.pingDot}>
                <Animated.View style={[styles.pingRing, pingRingStyle]} />
                <View style={styles.pingDotInner} />
              </View>
              <Text style={styles.liveLabel}>Live Session</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.finishBtn, pressed && styles.finishBtnPressed]}
          onPress={onFinish}
        >
          <Text style={styles.finishBtnText}>Finish</Text>
        </Pressable>
      </View>
      <View style={styles.timerRow}>
        <TimerUnit value={timerParts.hours} label="Hours" />
        <TimerUnit value={timerParts.minutes} label="Minutes" highlighted />
        <TimerUnit value={timerParts.seconds} label="Seconds" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: PERFORMANCE_BLUE,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pingDot: {
    position: 'relative',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  pingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  finishBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  finishBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timerUnit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timerUnitHighlighted: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  timerValueHighlighted: {
    color: ACCENT,
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
