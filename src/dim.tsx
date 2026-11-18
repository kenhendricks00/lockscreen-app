import * as Brightness from 'expo-brightness';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, Pressable, StyleSheet } from 'react-native';

const DIM_BRIGHTNESS = 0.05;
const canSetBrightness = Platform.OS !== 'web';

/**
 * Dims the screen after `seconds` without a touch. `wake()` undims it and
 * restarts the countdown. The real screen brightness is lowered too (and put
 * back on wake or when leaving the app), which saves battery.
 */
export function useIdleDim(enabled: boolean, seconds: number) {
  const [dimmed, setDimmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const startCountdown = useCallback(() => {
    clearTimeout(timer.current);
    if (enabled) timer.current = setTimeout(() => setDimmed(true), seconds * 1000);
  }, [enabled, seconds]);

  const wake = useCallback(() => {
    setDimmed(false);
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    startCountdown();
    const sub = AppState.addEventListener('change', (state) => state !== 'active' && wake());
    return () => {
      clearTimeout(timer.current);
      sub.remove();
    };
  }, [startCountdown, wake]);

  // Turning dimming off (e.g. "Keep screen bright") always shows the screen bright.
  const isDimmed = enabled && dimmed;

  // Lower the real brightness while dimmed; the cleanup puts it back on wake,
  // when leaving the app, or on unmount.
  useEffect(() => {
    if (!canSetBrightness || !isDimmed) return;
    let cancelled = false;
    let saved: number | null = null;

    Brightness.getBrightnessAsync()
      .then((level) => {
        if (cancelled) return;
        saved = level;
        return Brightness.setBrightnessAsync(Math.min(level, DIM_BRIGHTNESS));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (saved !== null) Brightness.setBrightnessAsync(saved).catch(() => {});
    };
  }, [isDimmed]);

  return { dimmed: isDimmed, wake };
}

/** Dark layer over the lock screen while dimmed; the first tap only wakes it. */
export function DimOverlay({ dimmed, onWake }: { dimmed: boolean; onWake: () => void }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: dimmed ? 0.45 : 0,
      duration: dimmed ? 1200 : 200,
      useNativeDriver: canSetBrightness,
    }).start();
  }, [dimmed, opacity]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={dimmed ? 'auto' : 'none'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onWake} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'black' },
});
