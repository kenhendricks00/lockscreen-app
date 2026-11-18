import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { fallbackWeather, location } from './config';

export type Weather = typeof fallbackWeather;
type IconName = ComponentProps<typeof Ionicons>['name'];

const REFRESH_MS = 15 * 60_000;

const URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${location.latitude}&longitude=${location.longitude}` +
  '&current=temperature_2m,weather_code,is_day' +
  '&daily=temperature_2m_max,temperature_2m_min' +
  '&temperature_unit=fahrenheit&timezone=auto&forecast_days=1';

async function fetchWeather(): Promise<Weather> {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const { current, daily } = await res.json();
  return {
    temp: Math.round(current.temperature_2m),
    high: Math.round(daily.temperature_2m_max[0]),
    low: Math.round(daily.temperature_2m_min[0]),
    code: current.weather_code,
    isDay: current.is_day === 1,
  };
}

/** Live weather; keeps the last good (or fallback) value when offline. */
export function useWeather() {
  const [weather, setWeather] = useState<Weather>(fallbackWeather);

  useEffect(() => {
    const load = () => fetchWeather().then(setWeather).catch(() => {});
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return weather;
}

/** WMO weather code -> label and icon, worded like Apple Weather. */
export function describe({ code, isDay }: Weather): { label: string; icon: IconName } {
  if (code === 0) return isDay ? { label: 'Sunny', icon: 'sunny' } : { label: 'Clear', icon: 'moon' };
  if (code <= 2) {
    const label = code === 1 ? (isDay ? 'Mostly Sunny' : 'Mostly Clear') : 'Partly Cloudy';
    return { label, icon: isDay ? 'partly-sunny' : 'cloudy-night' };
  }
  if (code === 3) return { label: 'Cloudy', icon: 'cloudy' };
  if (code <= 48) return { label: 'Foggy', icon: 'cloudy' };
  if (code <= 57) return { label: 'Drizzle', icon: 'rainy' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: 'Rain', icon: 'rainy' };
  if (code <= 86) return { label: 'Snow', icon: 'snow' };
  return { label: 'Thunderstorms', icon: 'thunderstorm' };
}
