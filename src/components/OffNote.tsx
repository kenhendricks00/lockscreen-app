import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { OffColor } from '../config';
import { sans } from '../fonts';
import type { PushNote } from '../pushover';
import { useSettings } from '../settings';

const COLORS: Record<OffColor, string> = {
  gray: '255, 244, 230', // warm white; the opacity makes it a gray
  amber: '255, 176, 64',
  red: '255, 70, 50',
};
const REVEAL_MS = 10_000; // how long tapping the dot shows the text
const DRIFT = 6; // points the note wanders, against OLED burn-in

/** A small offset that changes every minute, so nothing sits still for hours. */
function drift(now: Date) {
  const minute = Math.floor(now.getTime() / 60_000);
  return { x: ((minute % 5) - 2) * DRIFT, y: ((minute % 7) - 3) * DRIFT };
}

type Props = { note: PushNote; more: number; now: Date; bottom: number };

/**
 * The newest notification, drawn faintly over the black "off" screen: big
 * enough to read from a foot or two away, too dim and small to read from
 * across a room. In dot style, a faint dot shows instead; tap it to see the
 * text for a few seconds.
 */
export function OffNote({ note, more, now, bottom }: Props) {
  const { offNoteStyle, offTextSize, offBrightness, offColor, hideText } = useSettings().settings;
  // Revealed for one notification id, so a new notification hides it again.
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const revealed = revealedId === note.id;
  const [peeking, setPeeking] = useState(false);
  const color = `rgba(${COLORS[offColor]}, ${offBrightness})`;
  const { x, y } = drift(now);

  useEffect(() => {
    if (!revealed) return;
    const id = setTimeout(() => setRevealedId(null), REVEAL_MS);
    return () => clearTimeout(id);
  }, [revealed]);

  const position = { bottom: bottom + 150 + y, transform: [{ translateX: x }] };

  if (offNoteStyle === 'dot' && !revealed) {
    return (
      <View style={[styles.dotSpot, position]} pointerEvents="box-none">
        <Pressable onPress={() => setRevealedId(note.id)} hitSlop={40}>
          <PulsingDot color={color} />
        </Pressable>
      </View>
    );
  }

  const showMessage = !hideText || peeking;
  const text = { color, fontSize: offTextSize, lineHeight: Math.round(offTextSize * 1.2) };

  // Press and hold peeks at a hidden message; nothing here wakes the screen.
  return (
    <Pressable
      style={[styles.note, position]}
      onLongPress={() => setPeeking(true)}
      onPressOut={() => setPeeking(false)}
      delayLongPress={250}
    >
      <Text style={[styles.title, text]} numberOfLines={1}>
        {note.title}
        {more > 0 && <Text style={styles.more}>{`  +${more}`}</Text>}
      </Text>
      {showMessage && (
        <Text style={[styles.message, text]} numberOfLines={2}>
          {note.message}
        </Text>
      )}
    </Pressable>
  );
}

function PulsingDot({ color }: { color: string }) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  note: { position: 'absolute', left: '7.5%', right: '7.5%', alignItems: 'center' },
  title: { ...sans('600'), textAlign: 'center' },
  message: { ...sans('600'), textAlign: 'center' },
  more: { ...sans('500') },
  dotSpot: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
