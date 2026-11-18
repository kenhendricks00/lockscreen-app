// Minimal unofficial Pushover Open Client: https://pushover.net/api/client
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';

export type PushNote = {
  id: string;
  title: string;
  message: string;
  date: number; // unix seconds
  receipt?: string; // set on unacknowledged emergency-priority messages
};

export type PushoverAccount = { secret: string; deviceId: string };

const API = 'https://api.pushover.net/1';
const SOCKET_URL = 'wss://client.pushover.net/push';
const NOTES_KEY = 'pushover-notes';
const ACCOUNT_KEY = 'pushover-account';
const KEEP = 20;
const headers = { 'User-Agent': 'LockScreen/1.0 (unofficial Pushover Open Client)' };

const minutesAgo = (minutes: number) => Math.floor(Date.now() / 1000) - minutes * 60;
const SAMPLES: PushNote[] = [
  { id: 's1', title: 'Front door', message: 'A package was delivered to the porch.', date: minutesAgo(2) },
  { id: 's2', title: 'Build finished', message: 'The unsigned .ipa is ready to download.', date: minutesAgo(25) },
  { id: 's3', title: 'Reminder', message: 'Dentist appointment tomorrow at 10.', date: minutesAgo(130) },
];

async function post(path: string, params: Record<string, string>) {
  const body = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  return { status: res.status, json: await res.json() };
}

type ApiErrors = { errors?: string[] | Record<string, string[]> };

function errorText({ errors }: ApiErrors) {
  if (!errors) return 'Pushover sign-in failed.';
  if (Array.isArray(errors)) return errors.join(' ');
  return Object.entries(errors)
    .map(([field, messages]) => `${field} ${messages.join(', ')}`)
    .join('. ');
}

// The secret lives in the iPhone Keychain, never in the code or the build.
// (The Keychain doesn't exist on web, so the web preview just won't remember it.)
export const loadAccount = (): Promise<PushoverAccount | null> =>
  SecureStore.getItemAsync(ACCOUNT_KEY)
    .then((json) => (json ? JSON.parse(json) : null))
    .catch(() => null);

export const saveAccount = (account: PushoverAccount | null) =>
  (account
    ? SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(account))
    : SecureStore.deleteItemAsync(ACCOUNT_KEY)
  ).catch(() => {});

/**
 * Logs in and registers this phone as a Pushover device. The password is only
 * sent to Pushover; just the returned secret and device id are kept.
 * Returns 'needs-2fa' when the account asks for a two-factor code.
 */
export async function signIn(email: string, password: string, twofa: string) {
  const params: Record<string, string> = { email, password };
  if (twofa) params.twofa = twofa;

  const login = await post('/users/login.json', params);
  if (login.status === 412) return 'needs-2fa' as const;
  if (login.json.status !== 1) throw new Error(errorText(login.json));

  // Device names must be unique per account, and a reinstall can't reuse the
  // old device (its secret is gone), so add a short random suffix.
  const name = `lockscreen-${Math.random().toString(36).slice(2, 6)}`;
  const device = await post('/devices.json', { secret: login.json.secret, name, os: 'O' });
  if (device.json.status !== 1) throw new Error(errorText(device.json));

  return { secret: login.json.secret as string, deviceId: device.json.id as string };
}

type RawMessage = {
  id_str: string;
  title?: string;
  message: string;
  app: string;
  date: number;
  priority: number;
  acked?: number;
  receipt?: string;
  html?: number;
};

const toNote = (m: RawMessage): PushNote => ({
  id: m.id_str,
  title: m.title || m.app,
  message: m.html ? m.message.replace(/<[^>]+>/g, '') : m.message,
  date: m.date,
  receipt: m.priority >= 2 && m.acked !== 1 ? m.receipt : undefined,
});

/** Downloads pending messages (newest first), then deletes them from Pushover's servers. */
async function sync({ secret, deviceId }: PushoverAccount): Promise<PushNote[]> {
  const res = await fetch(`${API}/messages.json?secret=${secret}&device_id=${deviceId}`, { headers });
  const { messages = [] }: { messages?: RawMessage[] } = await res.json();
  if (messages.length === 0) return [];

  const highest = messages.map((m) => BigInt(m.id_str)).reduce((a, b) => (a > b ? a : b));
  await post(`/devices/${deviceId}/update_highest_message.json`, { secret, message: String(highest) });
  return messages.map(toNote).sort((a, b) => b.date - a.date);
}

/** Live notifications over Pushover's WebSocket, saved on the phone until dismissed. */
export function usePushover(account: PushoverAccount | null, demo: boolean) {
  const [notes, setNotes] = useState<PushNote[]>([]);
  const [samples, setSamples] = useState(SAMPLES);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY)
      .then((json) => json && setNotes(JSON.parse(json)))
      .catch(() => {})
      .finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if (restored) AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes, restored]);

  useEffect(() => {
    if (!account || !restored) return;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;

    const pull = () =>
      sync(account)
        .then((fresh) => fresh.length && setNotes((old) => [...fresh, ...old].slice(0, KEEP)))
        .catch(() => {});

    const connect = () => {
      socket = new WebSocket(SOCKET_URL);
      socket.binaryType = 'arraybuffer';
      socket.onopen = () => {
        socket.send(`login:${account.deviceId}:${account.secret}\n`);
        pull();
      };
      socket.onmessage = ({ data }) => {
        const frame = typeof data === 'string' ? data : String.fromCharCode(new Uint8Array(data)[0]);
        if (frame === '!') pull();
        if (frame === 'R') socket.close();
        // E: bad login or disabled device. A: logged in elsewhere. Don't fight either.
        if (frame === 'E' || frame === 'A') stopped = true;
      };
      socket.onclose = () => {
        if (!stopped) retry = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      socket.close();
    };
  }, [account, restored]);

  const dismiss = (note: PushNote) => {
    if (note.receipt && account) {
      post(`/receipts/${note.receipt}/acknowledge.json`, { secret: account.secret }).catch(() => {});
    }
    LayoutAnimation.easeInEaseOut();
    const without = (list: PushNote[]) => list.filter((n) => n.id !== note.id);
    setNotes(without);
    setSamples(without);
  };

  if (demo) return { notes: samples, dismiss };
  return { notes: account ? notes : [], dismiss };
}
