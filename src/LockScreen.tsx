import { ImageBackground, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Clock } from './components/Clock';
import { DateLine } from './components/DateLine';
import { useNow } from './time';

const wallpaper = require('../assets/wallpaper.jpg');

// Offsets were measured on the reference (428x926 pt, notch, 47 pt top inset)
// and are applied relative to the safe area, so Dynamic Island phones shift
// everything down the same way iOS does. Web has no insets, so it falls back
// to the reference phone's.
export function LockScreen() {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 47);

  return (
    <ImageBackground source={wallpaper} resizeMode="cover" style={styles.screen}>
      <View style={{ paddingTop: top + 57 }}>
        <DateLine now={now} />
        <Clock now={now} />
      </View>

      {/* iPhones draw the real home indicator on top of every app. */}
      {Platform.OS !== 'ios' && <View style={styles.homeIndicator} />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 153,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'white',
  },
});
