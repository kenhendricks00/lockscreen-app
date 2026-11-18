// Everything personal on the lock screen lives here. Edit and save;
// Expo Go reloads instantly.

export const nextEvent = {
  time: '3:30',
  period: 'PM',
  title: 'Study group in the library',
};

export const verse = {
  reference: 'Isaiah 40:8 NLT',
  text: 'The grass withers and the flowers fade, but the word of our God stands forever.',
};

export const location = { latitude: 40.71, longitude: -74.01 }; // New York

// Shown until the first forecast loads, or if the phone is offline.
export const fallbackWeather = { temp: 61, high: 61, low: 37, code: 0, isDay: true };

// true stops the iPhone from dimming and auto-locking while the app is open,
// so it works as an always-on display (best on a charger).
export const keepAwake = true;

// Pushover notifications. Your login secret goes in .env.local (see README),
// never in this file. The newest notification borrows one spot on the screen
// until you tap it away; with none pending, the spot looks normal.
//   'edge'    - small sideways text running up the left edge
//   'weather' - takes the weather widget's place
//   'event'   - takes the calendar event's place in the top line
export type Placement = 'edge' | 'weather' | 'event';

export const notifications = {
  placement: 'edge' as Placement,
  demo: false, // true shows sample notifications, handy for picking a placement
};
