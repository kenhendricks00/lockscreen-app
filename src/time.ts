import { useEffect, useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Current time, re-rendering right when the minute changes. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const msLeft = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    const id = setTimeout(() => setNow(new Date()), msLeft);
    return () => clearTimeout(id);
  }, [now]);

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
