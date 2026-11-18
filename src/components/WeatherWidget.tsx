import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { sans } from '../fonts';
import { describe, useWeather } from '../weather';

export function WeatherWidget() {
  const weather = useWeather();
  const { label, icon } = describe(weather);

  return (
    <View style={styles.widget}>
      <View style={styles.row}>
        <Ionicons name={icon} size={19} color="white" style={styles.icon} />
        <Text style={[styles.text, styles.temp]}>{weather.temp}°</Text>
      </View>
      <Text style={styles.text}>{label}</Text>
      <Text style={[styles.text, styles.range]}>
        ↑{weather.high}° ↓{weather.low}°
      </Text>
    </View>
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
  temp: { ...sans('600'), color: 'white' },
  range: { color: 'rgba(255, 255, 255, 0.72)' },
});
