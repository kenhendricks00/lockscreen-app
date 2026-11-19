import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image, Pressable, ScrollView, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { sans } from '../fonts';
import { type NoteIcon, noteIcons } from '../noteIcons';
import { iconUrl, type PushNote } from '../pushover';
import { useSettings } from '../settings';

function timeAgo(seconds: number, now: Date) {
  const minutes = Math.floor((now.getTime() / 1000 - seconds) / 60);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / (24 * 60))}d ago`;
}

/**
 * An app-style icon: the sending app's Pushover icon ('app'), or one of the
 * generic ones. Falls back to the bell when a notification has no icon.
 */
export function AppIcon({ icon, pushoverIcon }: { icon: NoteIcon; pushoverIcon?: string }) {
  if (icon === 'app' && pushoverIcon) {
    return <Image source={{ uri: iconUrl(pushoverIcon) }} style={[styles.icon, styles.image]} />;
  }
  const { glyph, color } = noteIcons[icon === 'app' ? 'bell' : icon];
  return (
    <View style={[styles.icon, styles.glyph, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={glyph} size={21} color="white" />
    </View>
  );
}

function Card({ note, now, onPress }: { note: PushNote; now: Date; onPress: () => void }) {
  const { noteIcon, noteName } = useSettings().settings;
  const name = noteName.trim();

  // With a name set, cards use the older iOS layout: name, then title, then message.
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <AppIcon icon={noteIcon} pushoverIcon={note.icon} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.text, styles.title]} numberOfLines={1}>
            {name || note.title}
          </Text>
          <Text style={styles.time}>{timeAgo(note.date, now)}</Text>
        </View>
        {name !== '' && (
          <Text style={[styles.text, styles.subtitle]} numberOfLines={1}>
            {note.title}
          </Text>
        )}
        <Text style={styles.text} numberOfLines={name ? 3 : 4}>
          {note.message}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Every notification as an iOS-style card, newest on top, sitting just above
 * the buttons. It scrolls once there are more than fit. Tap a card to dismiss it.
 */
export function NoteList({
  notes,
  now,
  onDismiss,
  style,
}: {
  notes: PushNote[];
  now: Date;
  onDismiss: (note: PushNote) => void;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      pointerEvents="box-none"
    >
      {notes.map((note) => (
        <Card key={note.id} note={note} now={now} onPress={() => onDismiss(note)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexGrow + flex-end keeps a short list sitting down by the buttons.
  list: { flexGrow: 1, justifyContent: 'flex-end', gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(40, 40, 60, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  icon: { width: 36, height: 36, borderRadius: 9 },
  // Some Pushover icons are transparent; a white tile makes them read as app icons.
  image: { backgroundColor: 'white' },
  glyph: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  text: { ...sans('400'), fontSize: 15, lineHeight: 19, color: 'rgba(255, 255, 255, 0.92)' },
  title: { ...sans('600'), flex: 1, color: 'white' },
  subtitle: { ...sans('500'), color: 'white' },
  time: { ...sans('400'), fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' },
});
