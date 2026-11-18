// Minimal unofficial Pushover Open Client: https://pushover.net/api/client
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LayoutAnimation } from 'react-native';

import { notifications } from './config';

export type PushNote = {
  id: string;
  title: string;
  message: string;
  date: number; // unix seconds
  receipt?: string; // set on unacknowledged emergency-priority messages
};

const API = 'https://api.pushover.net/1';
const SOCKET_URL = 'wss://client.pushover.net/push';
const STORAGE_KEY = 'pushover-notes';
const KEEP = 20;

const secret = process.env.EXPO_PUBLIC_PUSHOVER_SECRET ?? '';
const deviceId = process.env.EXPO_PUBLIC_PUSHOVER_DEVICE_ID ?? '';
const configured = Boolean(secret && deviceId);
const headers = { 'User-Agent': 'LockScreen/1.0 (unofficial Pushover Open Client)' };

const minutesAgo = (minutes: number) => Math.floor(Date.now() / 1000) - minutes * 60;
const SAMPLES: PushNote[] = [
  { id: 's1', title: 'Front door', message: 'A package was delivered to the porch.', date: minutesAgo(2) },
  { id: 's2', title: 'Build finished', message: 'The unsigned .ipa is ready to download.', date: minutesAgo(25) },
  { id: 's3', title: 'Reminder', message: 'Dentist appointment tomorrow at 10.', date: minutesAgo(130) },
];

function post(path: string, params: Record<string, string>) {
  const body = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return fetch(API + path, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
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
async function sync(): Promise<PushNote[]> {
  const res = await fetch(`${API}/messages.json?secret=${secret}&device_id=${deviceId}`, { headers });
  const { messages = [] }: { messages?: RawMessage[] } = await res.json();
  if (messages.length === 0) return [];

  const highest = messages.map((m) => BigInt(m.id_str)).reduce((a, b) => (a > b ? a : b));
  await post(`/devices/${deviceId}/update_highest_message.json`, { secret, message: String(highest) });
  return messages.map(toNote).sort((a, b) => b.date - a.date);
}

/** Live notifications over Pushover's WebSocket, saved on the phone until dismissed. */
export function usePushover() {
  const [notes, setNotes] = useState<PushNote[]>(notifications.demo ? SAMPLES : []);
  const [restored, setRestored] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => json && setNotes(JSON.parse(json)))
      .finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if (configured && restored) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, restored]);

  useEffect(() => {
    if (!configured || !restored) return;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;

    const pull = () =>
      sync()
        .then((fresh) => fresh.length && setNotes((old) => [...fresh, ...old].slice(0, KEEP)))
        .catch(() => {});

    const connect = () => {
      socket = new WebSocket(SOCKET_URL);
      socket.binaryType = 'arraybuffer';
      socket.onopen = () => {
        socket.send(`login:${deviceId}:${secret}\n`);
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
  }, [restored]);

  const dismiss = (note: PushNote) => {
    if (note.receipt) post(`/receipts/${note.receipt}/acknowledge.json`, { secret }).catch(() => {});
    LayoutAnimation.easeInEaseOut();
    setNotes((old) => old.filter((n) => n.id !== note.id));
  };

  return { notes, dismiss };
}
