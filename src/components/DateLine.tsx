import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { nextEvent } from '../config';
import { sans } from '../fonts';
import { formatDay } from '../time';

const EVENT_COLOR = 'rgba(232, 244, 255, 0.92)';

export function DateLine({ now }: { now: Date }) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{formatDay(now)}</Text>
      <MaterialCommunityIcons name="calendar-month" size={20} color={EVENT_COLOR} style={styles.icon} />
      <Text style={[styles.text, styles.event]} numberOfLines={1}>
        {nextEvent.time}
        <Text style={styles.period}>{nextEvent.period}</Text> {nextEvent.title}
      </Text>
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
    color: 'rgba(255, 255, 255, 0.92)',
  },
  icon: { marginLeft: 14, marginRight: 7 },
  event: { flexShrink: 1, color: EVENT_COLOR },
  period: { fontSize: 17 },
});
