import { Image, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Clock } from './components/Clock';
import { DateLine } from './components/DateLine';
import { EdgeNote, NoteWidget } from './components/Notifications';
import { CameraButton, FlashlightButton } from './components/QuickButtons';
import { VerseWidget } from './components/VerseWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { notifications } from './config';
import { usePushover } from './pushover';
import { useNow } from './time';

const wallpaper = require('../assets/wallpaper.jpg');
const BUTTONS_OFFSET = 24; // flashlight/camera row, above the bottom safe area

// Offsets were measured on the reference (428x926 pt, notch, 47 pt top inset)
// and are applied relative to the safe area, so Dynamic Island phones shift
// everything down the same way iOS does. Web has no insets, so it falls back
// to the reference phone's.
export function LockScreen() {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 47);
  const bottom = Math.max(insets.bottom, 34);

  const { notes, dismiss } = usePushover();
  const note = notes[0];
  const dismissNote = () => note && dismiss(note);
  const noteAt = (spot: typeof notifications.placement) =>
    notifications.placement === spot ? note : undefined;

  const weatherNote = noteAt('weather');
  const edgeNote = noteAt('edge');

  return (
    <View style={styles.screen}>
      <Image source={wallpaper} resizeMode="cover" style={styles.wallpaper} />
      <View style={{ paddingTop: top + 57 }}>
        <DateLine now={now} note={noteAt('event')} onNotePress={dismissNote} />
        <Clock now={now} />
        <View style={styles.widgets}>
          {weatherNote ? <NoteWidget note={weatherNote} onPress={dismissNote} /> : <WeatherWidget />}
          <VerseWidget />
        </View>
      </View>

      {edgeNote && <EdgeNote note={edgeNote} onPress={dismissNote} bottom={bottom + BUTTONS_OFFSET} />}

      <View style={[styles.buttons, { bottom: bottom + BUTTONS_OFFSET }]}>
        <FlashlightButton />
        <CameraButton />
      </View>

      {/* iPhones draw the real home indicator on top of every app. */}
      {Platform.OS !== 'ios' && <View style={styles.homeIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  wallpaper: { position: 'absolute', width: '100%', height: '100%' },
  widgets: {
    width: 348,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
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
