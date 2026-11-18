import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { type ReactNode, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';

const SIZE = 58;
const isNative = Platform.OS !== 'web';

function GlassButton({ active, onPress, children }: { active?: boolean; onPress?: () => void; children: ReactNode }) {
  const [scale] = useState(() => new Animated.Value(1));
  const springTo = (toValue: number) =>
    Animated.spring(scale, { toValue, speed: 40, bounciness: 8, useNativeDriver: isNative }).start();

  return (
    <Pressable onPress={onPress} onPressIn={() => springTo(1.18)} onPressOut={() => springTo(1)}>
      <Animated.View style={[styles.button, active && styles.active, { transform: [{ scale }] }]}>
        {!active && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Toggles the real torch on iPhone. expo-camera only drives the torch while a
 * camera view is mounted, so a 1x1 invisible one is rendered while it's on.
 */
export function FlashlightButton() {
  const [on, setOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const toggle = async () => {
    if (!on && isNative && !permission?.granted) await requestPermission();
    setOn((value) => !value);
  };

  return (
    <GlassButton active={on} onPress={toggle}>
      {on && isNative && permission?.granted && <CameraView enableTorch style={styles.hiddenCamera} />}
      <MaterialCommunityIcons name="flashlight" size={28} color={on ? 'black' : 'white'} />
    </GlassButton>
  );
}

export function CameraButton() {
  return (
    <GlassButton>
      <Ionicons name="camera" size={26} color="white" />
    </GlassButton>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  active: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  hiddenCamera: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
