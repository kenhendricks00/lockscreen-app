import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Clock } from './components/Clock';
import { DateLine } from './components/DateLine';
import { LockStatusBar } from './components/LockStatusBar';
import { NoteList } from './components/NoteList';
import { EdgeNote, NoteWidget } from './components/Notifications';
import { OffNote } from './components/OffNote';
import { CameraButton, FlashlightButton } from './components/QuickButtons';
import { SettingsSheet } from './components/SettingsSheet';
import { VerseWidget } from './components/VerseWidget';
import { WeatherWidget } from './components/WeatherWidget';
import type { Placement } from './config';
import { DimOverlay, useIdleDim } from './dim';
import { setHomeIndicatorAutoHidden } from '../modules/home-indicator';
import { onWatchDismiss, sendToWatch } from '../modules/watch-bridge';
import { type PushNote, usePushover } from './pushover';
import { useSettings } from './settings';
import { readAloud } from './speech';
import { applyAlias, isHidden, isQuiet, parseAliases, shouldWake } from './stealth';
import { useNow } from './time';

const defaultWallpaper = require('../assets/wallpaper.jpg');
const BUTTONS_OFFSET = 24; // flashlight/camera row, above the bottom safe area
const BUTTON_SIZE = 58;
const WIDGETS_BOTTOM = 280; // below the safe area top: date line, clock and widgets
const PREVIEW_NOTE: PushNote = {
  id: 'preview',
  title: 'Front door',
  message: 'A package was delivered to the porch.',
  date: 0,
};

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
  const [previewing, setPreviewing] = useState(false);

  // Never let the iPhone auto-lock; dim when idle instead (unless always bright).
  useKeepAwake();
  const offStyle = settings.dimStyle === 'off';
  const idle = useIdleDim(!settings.alwaysBright && !settingsOpen, settings.dimAfter, offStyle);
  const { dimmed } = idle;
  const wake = () => {
    setPreviewing(false);
    idle.wake();
  };
  const screenOff = dimmed && offStyle;

  // iOS hides its home indicator bar a few seconds after the last touch, but
  // only while the black "off" screen is up (needs the installed app).
  useEffect(() => setHomeIndicatorAutoHidden(screenOff), [screenOff]);

  // New notifications may wake a dimmed screen, buzz, and be spoken. Quiet
  // ones (Pushover priority -1 and -2, when followed) do none of that.
  const { notes: allNotes, dismiss } = usePushover(
    pushover,
    {
      demo: settings.demoNotifications,
      remember: settings.rememberNotes,
      autoHide: settings.autoHide,
    },
    (fresh) => {
      const loud = fresh.filter((n) => !isQuiet(n, settings));
      if (shouldWake(loud, settings)) idle.wake();
      if (loud.length > 0 && settings.haptic) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      const aliases = parseAliases(settings.aliases);
      readAloud(
        loud.map((n) => applyAlias(n, aliases)),
        settings.readAloudMode,
        settings.speakDetail,
        settings.speechRate,
      );
    },
  );

  // Aliases rename titles everywhere; priority -2 notes only show in Settings.
  const aliased = useMemo(() => {
    const aliases = parseAliases(settings.aliases);
    return allNotes.map((n) => applyAlias(n, aliases));
  }, [allNotes, settings.aliases]);
  const notes = aliased.filter((n) => !isHidden(n, settings));
  const hiddenNotes = aliased.filter((n) => isHidden(n, settings));

  // Apple Watch: mirror the newest notifications and the watch settings.
  // Comparing the JSON means it's only sent when something actually changed.
  const watchJson = JSON.stringify({
    notes: notes.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      date: n.received ?? n.date,
    })),
    screen: settings.watchScreen,
    complication: settings.watchComplication,
    glow: settings.offGlow,
    hideText: settings.hideText,
    haptic: settings.haptic,
  });
  const watchNewest = useRef<string | undefined>(undefined);
  useEffect(() => {
    const state = JSON.parse(watchJson);
    const newest: string | undefined = state.notes[0]?.id;
    // Only a newly arrived notification spends the complication refresh budget.
    const arrived = newest !== undefined && newest !== watchNewest.current;
    watchNewest.current = newest;
    sendToWatch(state, arrived);
  }, [watchJson]);

  // Swiping a notification away on the watch dismisses it here too.
  const latest = useRef({ allNotes, dismiss });
  useEffect(() => {
    latest.current = { allNotes, dismiss };
  });
  useEffect(() => {
    const sub = onWatchDismiss((id) => {
      const note = latest.current.allNotes.find((n) => n.id === id);
      if (note) latest.current.dismiss(note);
    });
    return () => sub.remove();
  }, []);

  const previewOffScreen = () => {
    setSettingsOpen(false);
    setPreviewing(true);
    idle.dimNow();
  };

  const note = notes[0];
  const offNote = note ?? (previewing ? PREVIEW_NOTE : undefined);
  const dismissNote = () => note && dismiss(note);
  const noteAt = (spot: Placement) => (settings.placement === spot ? note : undefined);

  const weatherNote = noteAt('weather');
  const edgeNote = noteAt('edge');
  const wallpaper = settings.wallpaper ? { uri: settings.wallpaper } : defaultWallpaper;

  return (
    <>
      {/* Long-press anywhere opens Settings, like customizing the real lock screen. */}
      <Pressable
        style={styles.screen}
        onTouchStart={() => !dimmed && idle.wake()}
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
        {settings.placement === 'list' && (
          <NoteList
            notes={notes}
            now={now}
            onDismiss={dismiss}
            style={[
              styles.list,
              { top: top + WIDGETS_BOTTOM, bottom: bottom + BUTTONS_OFFSET + BUTTON_SIZE + 16 },
            ]}
          />
        )}

        <View style={[styles.buttons, { bottom: bottom + BUTTONS_OFFSET }]}>
          <FlashlightButton />
          <CameraButton />
        </View>

        {/* iPhones draw the real home indicator on top of every app. */}
        {Platform.OS !== 'ios' && <View style={styles.homeIndicator} />}
        <DimOverlay dimmed={dimmed} off={offStyle} onWake={wake} />
        {screenOff && offNote && (
          <OffNote note={offNote} more={Math.max(notes.length - 1, 0)} now={now} bottom={bottom} />
        )}
      </Pressable>
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hiddenNotes={hiddenNotes}
        onDismiss={dismiss}
        onPreviewOff={previewOffScreen}
      />
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
  list: { position: 'absolute', left: 10, right: 10 },
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
