import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Clock } from './components/Clock';
import { DateLine } from './components/DateLine';
import { LockStatusBar } from './components/LockStatusBar';
import { EdgeNote, NoteWidget } from './components/Notifications';
import { CameraButton, FlashlightButton } from './components/QuickButtons';
import { SettingsSheet } from './components/SettingsSheet';
import { VerseWidget } from './components/VerseWidget';
import { WeatherWidget } from './components/WeatherWidget';
import type { Placement } from './config';
import { DimOverlay, useIdleDim } from './dim';
import { usePushover } from './pushover';
import { useSettings } from './settings';
import { useNow } from './time';

const defaultWallpaper = require('../assets/wallpaper.jpg');
const BUTTONS_OFFSET = 24; // flashlight/camera row, above the bottom safe area

// Offsets were measured on a 428x926 pt iPhone (notch, 47 pt top inset) and
// are applied relative to the safe area, so Dynamic Island phones shift
// everything down the same way iOS does. Web has no insets, so it falls back
// to that phone's.
export function LockScreen() {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 47);
  const bottom = Math.max(insets.bottom, 34);
  const { settings, pushover } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Never let the iPhone auto-lock; dim when idle instead (unless always bright).
  useKeepAwake();
  const { dimmed, wake } = useIdleDim(!settings.alwaysBright && !settingsOpen, settings.dimAfter);

  const { notes, dismiss } = usePushover(pushover, settings.demoNotifications);
  const note = notes[0];
  const dismissNote = () => note && dismiss(note);

  // A new notification wakes a dimmed screen.
  const latestId = note?.id;
  useEffect(() => {
    if (latestId) wake();
  }, [latestId, wake]);
  const noteAt = (spot: Placement) => (settings.placement === spot ? note : undefined);

  const weatherNote = noteAt('weather');
  const edgeNote = noteAt('edge');
  const wallpaper = settings.wallpaper ? { uri: settings.wallpaper } : defaultWallpaper;

  return (
    <>
      {/* Long-press anywhere opens Settings, like customizing the real lock screen. */}
      <Pressable
        style={styles.screen}
        onTouchStart={wake}
        onLongPress={() => setSettingsOpen(true)}
        delayLongPress={600}
      >
        <Image source={wallpaper} resizeMode="cover" style={styles.wallpaper} />
        {settings.statusBar && <LockStatusBar top={top} carrier={settings.carrier} />}
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
        <DimOverlay dimmed={dimmed} onWake={wake} />
      </Pressable>
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
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
