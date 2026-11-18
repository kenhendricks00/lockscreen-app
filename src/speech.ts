import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { canDetectHeadphones, headphonesConnected } from '../modules/audio-route';
import type { ReadAloud } from './config';
import type { PushNote } from './pushover';

export { canDetectHeadphones };

const MAX_READ = 3;
let audioReady = false;

/** Speaks text, even with the silent switch on, without stopping any music. */
export async function say(text: string) {
  if (!audioReady && Platform.OS !== 'web') {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    audioReady = true;
  }
  Speech.speak(text);
}

// Checked right before speaking, so unplugging headphones takes effect at once.
const allowed = (mode: ReadAloud) => mode === 'always' || (mode === 'headphones' && headphonesConnected());

/** Says a short test line, if the mode allows speaking right now. */
export function previewReadAloud(mode: ReadAloud) {
  if (allowed(mode)) say('New notifications will be read aloud.');
}

/** Reads new notifications aloud, oldest first; a big backlog is summarized. */
export function readAloud(fresh: PushNote[], mode: ReadAloud) {
  if (!allowed(mode)) return;
  const newest = fresh.slice(0, MAX_READ).reverse();
  newest.forEach((note) => say(`${note.title}. ${note.message}`));
  const rest = fresh.length - newest.length;
  if (rest > 0) say(`And ${rest} more notification${rest === 1 ? '' : 's'}.`);
}
