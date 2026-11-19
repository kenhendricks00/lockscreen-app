import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { sans } from '../fonts';
import type { PushNote } from '../pushover';
import { useSettings } from '../settings';
import { arrivalTime, usePeek } from '../stealth';
import { formatDay } from '../time';

const EVENT_COLOR = '#EEF6FF';

type Props = { now: Date; note?: PushNote; onNotePress?: () => void };

/**
 * "Wed 18" plus the next calendar event, or a Pushover notification in its
 * place. Disguised, the notification wears the calendar icon and its arrival
 * time, so it reads like an event.
 */
export function DateLine({ now, note, onNotePress }: Props) {
  const { eventTime, eventTitle, disguise, hideText } = useSettings().settings;
  const { peeking, pressProps } = usePeek(() => onNotePress?.());
  // "3:30PM" -> "3:30" + a smaller "PM", like iOS.
  const [, clock, period = ''] = /^(.*?)(AM|PM)?$/i.exec(eventTime.trim()) ?? [];
  const hasEvent = Boolean(eventTime.trim() || eventTitle.trim());

  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.day]}>{formatDay(now, !note && !hasEvent)}</Text>
      {(note || hasEvent) && (
        <MaterialCommunityIcons
          name={note && !disguise ? 'bell' : 'calendar-month'}
          size={20}
          color={EVENT_COLOR}
          style={styles.icon}
        />
      )}
      {note ? (
        <Text style={[styles.text, styles.event]} numberOfLines={1} {...pressProps}>
          {disguise && <NoteTime note={note} />}
          {note.title}
          {(!hideText || peeking) && `: ${note.message}`}
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

function NoteTime({ note }: { note: PushNote }) {
  const { clock, period } = arrivalTime(note);
  return (
    <>
      {clock}
      <Text style={styles.period}>{period}</Text>{' '}
    </>
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
