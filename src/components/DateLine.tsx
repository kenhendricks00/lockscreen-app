import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { sans } from '../fonts';
import type { PushNote } from '../pushover';
import { useSettings } from '../settings';
import { formatDay } from '../time';

const EVENT_COLOR = '#EEF6FF';

type Props = { now: Date; note?: PushNote; onNotePress?: () => void };

/** "Wed 18" plus the next calendar event, or a Pushover notification in its place. */
export function DateLine({ now, note, onNotePress }: Props) {
  const { eventTime, eventTitle } = useSettings().settings;
  // "3:30PM" -> "3:30" + a smaller "PM", like iOS.
  const [, clock, period = ''] = /^(.*?)(AM|PM)?$/i.exec(eventTime.trim()) ?? [];
  const hasEvent = Boolean(eventTime.trim() || eventTitle.trim());

  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.day]}>{formatDay(now, !note && !hasEvent)}</Text>
      {(note || hasEvent) && (
        <MaterialCommunityIcons
          name={note ? 'bell' : 'calendar-month'}
          size={20}
          color={EVENT_COLOR}
          style={styles.icon}
        />
      )}
      {note ? (
        <Text style={[styles.text, styles.event]} numberOfLines={1} onPress={onNotePress}>
          {note.title}: {note.message}
        </Text>
      ) : (
        hasEvent && (
          <Text style={[styles.text, styles.event]} numberOfLines={1}>
            {clock}
            <Text style={styles.period}>{period.toUpperCase()}</Text> {eventTitle}
          </Text>
        )
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
