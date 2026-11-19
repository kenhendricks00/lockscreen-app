import * as Brightness from 'expo-brightness';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, Pressable, StyleSheet } from 'react-native';

const DIM_BRIGHTNESS = 0.05;
const DOUBLE_TAP_MS = 350;
const canSetBrightness = Platform.OS !== 'web';

/**
 * Dims the screen after `seconds` without a touch. `wake()` undims it and
 * restarts the countdown; `dimNow()` dims at once. The real screen brightness
 * is lowered too (to zero when `off`), and put back on wake or when leaving
 * the app, which saves battery.
 */
export function useIdleDim(enabled: boolean, seconds: number, off = false) {
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

  const dimNow = useCallback(() => {
    clearTimeout(timer.current);
    setDimmed(true);
  }, []);

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
        return Brightness.setBrightnessAsync(off ? 0 : Math.min(level, DIM_BRIGHTNESS));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (saved !== null) Brightness.setBrightnessAsync(saved).catch(() => {});
    };
  }, [isDimmed, off]);

  return { dimmed: isDimmed, wake, dimNow };
}

type OverlayProps = { dimmed: boolean; off: boolean; onWake: () => void };

/**
 * Dark layer over the lock screen while dimmed; the first tap only wakes it.
 * When `off`, it's pure black (OLED pixels switch off, so the phone looks
 * off) and waking takes a double tap, so brushing the phone doesn't light it.
 */
export function DimOverlay({ dimmed, off, onWake }: OverlayProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const lastTap = useRef(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: dimmed ? (off ? 1 : 0.45) : 0,
      duration: dimmed ? 1200 : 200,
      useNativeDriver: canSetBrightness,
    }).start();
  }, [dimmed, off, opacity]);

  const onPress = () => {
    const now = Date.now();
    if (!off || now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      onWake();
    } else {
      lastTap.current = now;
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents={dimmed ? 'auto' : 'none'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'black' },
});
