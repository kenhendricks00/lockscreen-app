import type { ClockFont } from './fonts';

// Defaults for a fresh install. Everything here can be changed on the phone:
// long-press the lock screen to open Settings. Changes are saved on the device
// only, so nothing personal ever needs to go in this file.

// Where the newest Pushover notification shows up (see README).
//   'edge'    - small sideways text running up the left edge
//   'weather' - takes the weather widget's place
//   'event'   - takes the calendar event's place in the top line
export type Placement = 'edge' | 'weather' | 'event';

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
  // The app never lets the iPhone auto-lock. With alwaysBright off, it dims
  // after dimAfter seconds idle; a tap or a new notification wakes it.
  alwaysBright: false,
  dimAfter: 30,
  statusBar: true, // carrier, signal, Wi-Fi and battery along the top
  carrier: '', // iOS doesn't tell apps the carrier name, so type it in Settings
};

export type Settings = typeof defaults;

// Shown until the first forecast loads, or if the phone is offline.
export const fallbackWeather = { temp: 61, high: 61, low: 37, code: 0, isDay: true };
