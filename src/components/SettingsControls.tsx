// Small iOS-style form pieces shared by the Settings sheet.
import { type ReactNode, useState } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { sans } from '../fonts';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Field({ style, ...props }: TextInputProps) {
  return <TextInput placeholderTextColor="#8e8e93" style={[styles.input, style]} {...props} />;
}

export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

type SegmentsProps<T> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** An iOS-style segmented control. */
export function Segments<T extends string | number>({ options, value, onChange }: SegmentsProps<T>) {
  return (
    <View style={styles.segments}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.segment, option.value === value && styles.segmentOn]}
        >
          <Text style={styles.segmentText}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onDone?: (value: number) => void; // when the finger lifts
};

/** A labeled slider with its value on the right. Tap or drag anywhere on the track. */
export function Slider({ label, value, min, max, step, format, onChange, onDone }: SliderProps) {
  const [width, setWidth] = useState(0);
  const fraction = Math.min(Math.max((value - min) / (max - min), 0), 1);

  const valueAt = (event: GestureResponderEvent) => {
    const x = Math.min(Math.max(event.nativeEvent.locationX, 0), width);
    const raw = min + (width ? x / width : 0) * (max - min);
    return Number((Math.round(raw / step) * step).toFixed(2));
  };
  const move = (event: GestureResponderEvent) => {
    const next = valueAt(event);
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.sliderRow}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        hitSlop={{ top: 12, bottom: 12 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        // Keep the drag even if it wanders, so the Settings sheet doesn't scroll.
        onResponderTerminationRequest={() => false}
        onResponderGrant={move}
        onResponderMove={move}
        onResponderRelease={(event) => onDone?.(valueAt(event))}
      >
        <View pointerEvents="none" style={[styles.fill, { width: `${fraction * 100}%` }]} />
        <View pointerEvents="none" style={[styles.thumb, { left: fraction * Math.max(width - THUMB, 0) }]} />
      </View>
      <Text style={styles.sliderValue}>{format(value)}</Text>
    </View>
  );
}

const THUMB = 22;

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

export const formStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1 },
  label: { ...sans('400'), fontSize: 16, color: 'white' },
});

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { ...sans('500'), fontSize: 13, color: '#8e8e93', textTransform: 'uppercase' },
  card: { backgroundColor: '#2c2c2e', borderRadius: 12, padding: 12, gap: 10 },
  input: {
    ...sans('400'),
    fontSize: 16,
    color: 'white',
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  pressed: { opacity: 0.7 },
  buttonText: { ...sans('600'), fontSize: 15, color: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...sans('400'), fontSize: 16, color: 'white' },
  hint: { ...sans('400'), fontSize: 13, color: '#8e8e93' },
  segments: { flexDirection: 'row', backgroundColor: '#3a3a3c', borderRadius: 9, padding: 2 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 7 },
  segmentOn: { backgroundColor: '#636366' },
  segmentText: { ...sans('500'), fontSize: 13, color: 'white' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: {
    flex: 1,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3a3a3c',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#0a84ff' },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: 'white',
  },
  sliderValue: { ...sans('500'), fontSize: 15, color: 'white', minWidth: 46, textAlign: 'right' },
});
