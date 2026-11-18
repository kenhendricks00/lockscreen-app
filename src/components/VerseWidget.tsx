import { StyleSheet, Text, View } from 'react-native';

import { verse } from '../config';
import { sans } from '../fonts';

export function VerseWidget() {
  return (
    <View style={styles.widget}>
      <Text style={[styles.text, styles.reference]} numberOfLines={1}>
        {verse.reference}
      </Text>
      <Text style={styles.text} numberOfLines={2}>
        {verse.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: { width: 154 },
  text: {
    ...sans('400'),
    fontSize: 16.5,
    lineHeight: 18.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  reference: { ...sans('700'), color: 'white', marginBottom: 1 },
});
