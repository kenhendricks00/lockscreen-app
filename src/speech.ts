import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { canDetectHeadphones, headphonesConnected } from '../modules/audio-route';
import type { ReadAloud, SpeakDetail } from './config';
import type { PushNote } from './pushover';

export { canDetectHeadphones };

const MAX_READ = 3;
let audioReady = false;

/**
 * Speaks text, even with the silent switch on, without stopping any music.
 * `rate` is a speed multiplier: 1 is the normal voice, 2 twice as fast.
 */
export async function say(text: string, rate = 1) {
  if (!audioReady && Platform.OS !== 'web') {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    audioReady = true;
  }
  Speech.speak(text, { rate });
}

// Checked right before speaking, so unplugging headphones takes effect at once.
const allowed = (mode: ReadAloud) => mode === 'always' || (mode === 'headphones' && headphonesConnected());

/** Says a short test line, if the mode allows speaking right now. */
export function previewReadAloud(mode: ReadAloud, rate: number) {
  if (!allowed(mode)) return;
  Speech.stop();
  say('New notifications will be read aloud.', rate);
}

const plural = (n: number) => `${n} notification${n === 1 ? '' : 's'}`;

/**
 * Reads new notifications aloud, oldest first; a big backlog is summarized.
 * 'private' says only "New notification" unless headphones are connected.
 */
export function readAloud(fresh: PushNote[], mode: ReadAloud, detail: SpeakDetail, rate: number) {
  if (fresh.length === 0 || !allowed(mode)) return;
  if (detail === 'private' && !headphonesConnected()) {
    say(fresh.length === 1 ? 'New notification.' : `${plural(fresh.length)}.`, rate);
    return;
  }
  const newest = fresh.slice(0, MAX_READ).reverse();
  newest.forEach((note) => say(detail === 'title' ? note.title : `${note.title}. ${note.message}`, rate));
  const rest = fresh.length - newest.length;
  if (rest > 0) say(`And ${rest} more ${rest === 1 ? 'notification' : 'notifications'}.`, rate);
}
