import { BlurView } from 'expo-blur';
import { Image, Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { notifications } from '../config';
import { sans } from '../fonts';
import { iconUrl, type PushNote, usePushover } from '../pushover';

function timeAgo(seconds: number, now: Date) {
  const minutes = Math.floor((now.getTime() / 1000 - seconds) / 60);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / (24 * 60))}d ago`;
}

function Card({ note, now, onPress }: { note: PushNote; now: Date; onPress: () => void }) {
  const look = looks[notifications.placement];
  return (
    <Pressable onPress={onPress} style={[styles.card, look.card]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <Image source={{ uri: iconUrl(note.icon) }} style={[styles.icon, look.icon]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, look.text]} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={[styles.time, look.small]}>{timeAgo(note.date, now)}</Text>
        </View>
        <Text style={[styles.message, look.text]} numberOfLines={look.lines}>
          {note.message}
        </Text>
      </View>
    </Pressable>
  );
}

/** Pushover notifications styled for the chosen placement. Tap one to dismiss it. */
export function Notifications({ now, style }: { now: Date; style: StyleProp<ViewStyle> }) {
  const { notes, dismiss } = usePushover();
  const hidden = notes.length - notifications.maxVisible;

  return (
    <View style={[styles.stack, style]} pointerEvents="box-none">
      {notes.slice(0, notifications.maxVisible).map((note) => (
        <Card key={note.id} note={note} now={now} onPress={() => dismiss(note)} />
      ))}
      {hidden > 0 && <Text style={styles.more}>{hidden} more</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 40, 60, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  icon: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  body: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  title: { ...sans('600'), flex: 1, color: 'white' },
  time: { ...sans('400'), color: 'rgba(255, 255, 255, 0.6)' },
  message: { ...sans('400'), color: 'rgba(255, 255, 255, 0.92)' },
  more: { ...sans('500'), fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' },
});

// Per-placement sizing: full iOS-style cards, a slim side column, or tiny corner pills.
const looks = {
  bottom: {
    card: { borderRadius: 22, padding: 13, gap: 11 },
    icon: { width: 36, height: 36, borderRadius: 9 },
    text: { fontSize: 15, lineHeight: 19 },
    small: { fontSize: 13 },
    lines: 2,
  },
  side: {
    card: { borderRadius: 16, padding: 9, gap: 8, alignItems: 'flex-start' as const },
    icon: { width: 22, height: 22, borderRadius: 6 },
    text: { fontSize: 13, lineHeight: 16 },
    small: { fontSize: 11 },
    lines: 3,
  },
  corner: {
    card: { borderRadius: 18, paddingVertical: 7, paddingHorizontal: 10, gap: 8 },
    icon: { width: 20, height: 20, borderRadius: 5 },
    text: { fontSize: 12.5, lineHeight: 15 },
    small: { fontSize: 11 },
    lines: 1,
  },
};
