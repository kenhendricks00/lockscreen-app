import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { nextEvent } from '../config';
import { sans } from '../fonts';
import type { PushNote } from '../pushover';
import { formatDay } from '../time';

const EVENT_COLOR = '#EEF6FF';

type Props = { now: Date; note?: PushNote; onNotePress?: () => void };

/** "Wed 18" plus the next calendar event, or a Pushover notification in its place. */
export function DateLine({ now, note, onNotePress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.day]}>{formatDay(now)}</Text>
      <MaterialCommunityIcons
        name={note ? 'bell' : 'calendar-month'}
        size={20}
        color={EVENT_COLOR}
        style={styles.icon}
      />
      {note ? (
        <Text style={[styles.text, styles.event]} numberOfLines={1} onPress={onNotePress}>
          {note.title}: {note.message}
        </Text>
      ) : (
        <Text style={[styles.text, styles.event]} numberOfLines={1}>
          {nextEvent.time}
          <Text style={styles.period}>{nextEvent.period}</Text> {nextEvent.title}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    paddingHorizontal: 32,
  },
  text: {
    ...sans('500'),
    fontSize: 21.5,
    color: 'white',
  },
  day: { flexShrink: 0 },
  icon: { marginLeft: 14, marginRight: 7 },
  event: { flexShrink: 1, color: EVENT_COLOR },
  period: { fontSize: 17 },
});
