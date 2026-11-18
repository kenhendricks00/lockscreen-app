import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sans } from '../fonts';
import type { PushNote } from '../pushover';

type Props = { note: PushNote; onPress: () => void };

/** A notification dressed as a lock screen widget, for the weather widget's spot. */
export function NoteWidget({ note, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.widget}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="bell" size={17} color="white" style={styles.icon} />
        <Text style={[styles.text, styles.title]} numberOfLines={1}>
          {note.title}
        </Text>
      </View>
      <Text style={styles.text} numberOfLines={2}>
        {note.message}
      </Text>
    </Pressable>
  );
}

const EDGE_LENGTH = 340;
const EDGE_THICKNESS = 18;

/**
 * A single line of sideways text up the left edge, ending level with the
 * bottom of the flashlight button. RN lays the box out unrotated and then
 * rotates it around its center, hence the offsets.
 */
export function EdgeNote({ note, onPress, bottom }: Props & { bottom: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.edge, { bottom: bottom + (EDGE_LENGTH - EDGE_THICKNESS) / 2 }]}
    >
      <Text style={styles.edgeText} numberOfLines={1}>
        {note.title}: {note.message}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  widget: { width: 158 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 6 },
  text: {
    ...sans('400'),
    fontSize: 17,
    lineHeight: 18.5,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  title: { ...sans('600'), flexShrink: 1, color: 'white' },
  edge: {
    position: 'absolute',
    left: 10 - EDGE_LENGTH / 2,
    width: EDGE_LENGTH,
    height: EDGE_THICKNESS,
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
  },
  edgeText: {
    ...sans('500'),
    fontSize: 13,
    textAlign: 'right',
    color: 'rgba(255, 255, 255, 0.88)',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowRadius: 3,
  },
});
