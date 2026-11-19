import type { ClockFont } from './fonts';
import type { NoteIcon } from './noteIcons';

// Defaults for a fresh install. Everything here can be changed on the phone:
// long-press the lock screen to open Settings. Changes are saved on the device
// only, so nothing personal ever needs to go in this file.

// Where Pushover notifications show up (see README).
//   'edge'    - the newest as small sideways text running up the left edge
//   'weather' - the newest in the weather widget's place
//   'event'   - the newest in the calendar event's place in the top line
//   'list'    - all of them as iOS-style cards above the buttons
export type Placement = 'edge' | 'weather' | 'event' | 'list';

// When new notifications are spoken: never, always, or only with headphones on.
export type ReadAloud = 'off' | 'always' | 'headphones';

// How much of a notification is spoken:
//   'full'    - "title. message"
//   'title'   - just the title
//   'private' - "New notification" out loud, the full text only into headphones
export type SpeakDetail = 'full' | 'title' | 'private';

// Whether a new notification wakes a dimmed screen: always, only for
// Pushover priority 1 and 2, or never.
export type WakeOnArrival = 'always' | 'priority' | 'never';

// How the idle screen dims:
//   'darken' - lower brightness and darken the lock screen
//   'off'    - pure black, so an OLED iPhone looks
//              switched off, with the newest notification drawn faintly on top
export type DimStyle = 'darken' | 'off';

// What the "off" screen shows when a notification is waiting.
export type OffNoteStyle = 'text' | 'dot';
export type OffColor = 'gray' | 'amber' | 'red';

export const defaults = {
  wallpaper: null as string | null, // a photo picked in Settings; null uses assets/wallpaper.jpg
  clockFont: 'serif' as ClockFont,
  eventTime: '3:30PM',
  eventTitle: 'Study group in the library',
  verseReference: 'Isaiah 40:8 NLT',
  verseText: 'The grass withers and the flowers fade, but the word of our God stands forever.',
  city: 'New York',
  latitude: 40.71,
  longitude: -74.01,
  placement: 'edge' as Placement,
  demoNotifications: false, // sample notifications, handy for picking a placement
  readAloudMode: 'off' as ReadAloud,
  noteIcon: 'app' as NoteIcon, // icon on List notifications; 'app' is the sender's own
  noteName: '', // name on List notifications; blank shows just the title
  // The app never lets the iPhone auto-lock. With alwaysBright off, it dims
  // after dimAfter seconds idle; a tap or a new notification wakes it.
  alwaysBright: false,
  dimAfter: 30,
  // Stealth. Every default below keeps the original behavior; Settings has a
  // one-tap "Stealth mode" preset and a button to put these back.
  wakeOnArrival: 'always' as WakeOnArrival,
  usePriority: false, // follow Pushover priority: -2 hidden, -1 silent
  disguise: false, // notifications look like the event, a widget, or faint edge text
  hideText: false, // show only the title; press and hold to peek at the message
  aliases: '', // one "match = label" per line, e.g. "Bank = Reminder"
  autoHide: 0, // seconds after arrival a notification disappears; 0 = until tapped
  rememberNotes: true, // keep notifications across app restarts
  haptic: false, // a short buzz when a notification arrives
  speakDetail: 'full' as SpeakDetail,
  dimStyle: 'darken' as DimStyle,
  offNoteStyle: 'text' as OffNoteStyle,
  offTextSize: 30,
  offGlow: 0.5, // opacity of the text on the black screen
  offColor: 'gray' as OffColor,
  statusBar: true, // carrier, signal, Wi-Fi and battery along the top
  carrier: '', // iOS doesn't tell apps the carrier name, so type it in Settings
};

export type Settings = typeof defaults;

// The settings the "Stealth mode" preset changes, and the values it sets.
export const stealthPreset: Partial<Settings> = {
  wakeOnArrival: 'never',
  usePriority: true,
  disguise: true,
  hideText: true,
  autoHide: 1800,
  rememberNotes: false,
  haptic: true,
  speakDetail: 'private',
  dimStyle: 'off',
  alwaysBright: false,
};

/**
 * The same keys at their original values, for "Restore original". Keep screen
 * bright is left as it is: stealth only switches it off so the screen can dim.
 */
export const originalBehavior = Object.fromEntries(
  Object.keys(stealthPreset)
    .filter((key) => key !== 'alwaysBright')
    .map((key) => [key, defaults[key as keyof Settings]]),
) as Partial<Settings>;

// Shown until the first forecast loads, or if the phone is offline.
export const fallbackWeather = { temp: 61, high: 61, low: 37, code: 0, isDay: true };
