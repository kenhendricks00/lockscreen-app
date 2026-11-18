import { ImageBackground, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Clock } from './components/Clock';
import { DateLine } from './components/DateLine';
import { Notifications } from './components/Notifications';
import { CameraButton, FlashlightButton } from './components/QuickButtons';
import { VerseWidget } from './components/VerseWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { notifications } from './config';
import { useNow } from './time';

const wallpaper = require('../assets/wallpaper.jpg');
const BUTTONS_OFFSET = 24; // flashlight/camera row, above the bottom safe area
const BUTTON_SIZE = 58;
const { placement } = notifications;

// Offsets were measured on the reference (428x926 pt, notch, 47 pt top inset)
// and are applied relative to the safe area, so Dynamic Island phones shift
// everything down the same way iOS does. Web has no insets, so it falls back
// to the reference phone's.
export function LockScreen() {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 47);
  const bottom = Math.max(insets.bottom, 34);
  const aboveButtons = bottom + BUTTONS_OFFSET + BUTTON_SIZE + 16;

  return (
    <ImageBackground source={wallpaper} resizeMode="cover" style={styles.screen}>
      <View style={{ paddingTop: top + 57 }}>
        <DateLine now={now} />
        <Clock now={now} />
        <View style={styles.widgets}>
          <WeatherWidget />
          <VerseWidget />
        </View>
        {placement === 'side' && <Notifications now={now} style={styles.side} />}
      </View>

      {placement !== 'side' && <Notifications now={now} style={[styles[placement], { bottom: aboveButtons }]} />}

      <View style={[styles.buttons, { bottom: bottom + BUTTONS_OFFSET }]}>
        <FlashlightButton />
        <CameraButton />
      </View>

      {/* iPhones draw the real home indicator on top of every app. */}
      {Platform.OS !== 'ios' && <View style={styles.homeIndicator} />}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  widgets: {
    width: 348,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  side: { alignSelf: 'flex-end', width: 172, marginTop: 28, marginRight: 12 },
  bottom: { position: 'absolute', left: 10, right: 10 },
  corner: { position: 'absolute', right: 14, width: 214 },
  buttons: {
    position: 'absolute',
    left: 53,
    right: 53,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
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
