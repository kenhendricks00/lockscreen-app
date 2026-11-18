import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import type { PushNote } from './pushover';

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

/** Reads new notifications aloud, oldest first; a big backlog is summarized. */
export function readAloud(fresh: PushNote[]) {
  const newest = fresh.slice(0, MAX_READ).reverse();
  newest.forEach((note) => say(`${note.title}. ${note.message}`));
  const rest = fresh.length - newest.length;
  if (rest > 0) say(`And ${rest} more notification${rest === 1 ? '' : 's'}.`);
}
