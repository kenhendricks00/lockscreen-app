import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { defaults, type Settings } from './config';
import { loadAccount, type PushoverAccount, saveAccount } from './pushover';

const STORAGE_KEY = 'settings';

type SettingsContextValue = {
  settings: Settings;
  update: (changes: Partial<Settings>) => void;
  pushover: PushoverAccount | null;
  setPushover: (account: PushoverAccount | null) => void;
};
const SettingsContext = createContext<SettingsContextValue>({
  settings: defaults,
  update: () => {},
  pushover: null,
  setPushover: () => {},
});

export const useSettings = () => useContext(SettingsContext);

/**
 * Loads saved settings (falling back to the defaults) and the Pushover account
 * from the Keychain, and saves every change.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pushover, setPushoverState] = useState<PushoverAccount | null>(null);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY).catch(() => null), loadAccount()]).then(
      ([json, account]) => {
        setPushoverState(account);
        setSettings({ ...defaults, ...(json ? JSON.parse(json) : {}) });
      },
    );
  }, []);

  useEffect(() => {
    if (settings) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  if (!settings) return null;

  const update = (changes: Partial<Settings>) => setSettings((prev) => ({ ...prev!, ...changes }));
  const setPushover = (account: PushoverAccount | null) => {
    setPushoverState(account);
    saveAccount(account);
  };

  return (
    <SettingsContext.Provider value={{ settings, update, pushover, setPushover }}>
      {children}
    </SettingsContext.Provider>
  );
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
