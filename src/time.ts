import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const minuteOf = (date: Date) => Math.floor(date.getTime() / 60_000);

/**
 * Current time, re-rendering only when the minute changes. It checks every
 * second instead of sleeping until the next minute, because iOS pauses timers
 * while the app is in the background; it also re-checks the moment the app
 * comes back, so the clock is never stale after waking the phone.
 */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => {
      const next = new Date();
      setNow((prev) => (minuteOf(prev) === minuteOf(next) ? prev : next));
    };
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  return now;
}

/** "1:11" — 12-hour, no leading zero, no AM/PM, like the iOS lock screen. */
export function formatClock(date: Date) {
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** "Wed 18" */
export function formatDay(date: Date) {
  return `${DAYS[date.getDay()]} ${date.getDate()}`;
}
