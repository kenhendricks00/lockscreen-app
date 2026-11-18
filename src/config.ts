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
