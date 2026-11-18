import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { defaults, type Settings } from './config';

const STORAGE_KEY = 'settings';

type SettingsContextValue = { settings: Settings; update: (changes: Partial<Settings>) => void };
const SettingsContext = createContext<SettingsContextValue>({ settings: defaults, update: () => {} });

export const useSettings = () => useContext(SettingsContext);

/** Loads saved settings (falling back to the defaults) and saves every change. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => setSettings({ ...defaults, ...(json ? JSON.parse(json) : {}) }))
      .catch(() => setSettings(defaults));
  }, []);

  useEffect(() => {
    if (settings) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  if (!settings) return null;

  const update = (changes: Partial<Settings>) => setSettings((prev) => ({ ...prev!, ...changes }));
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

/**
 * Lets the user pick a photo and copies it into the app's documents folder,
 * since the picker's own copy lives in a cache iOS may clear.
 */
export async function pickWallpaper(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled) return null;

  const picked = result.assets[0].uri;
  if (Platform.OS === 'web') return picked;

  const extension = picked.split('.').pop() ?? 'jpg';
  const saved = new File(Paths.document, `wallpaper-${Date.now()}.${extension}`);
  await new File(picked).copy(saved);
  return saved.uri;
}

export function deleteWallpaper(uri: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}
