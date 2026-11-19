// Helpers for the stealth settings: aliases, Pushover priority, peeking.
import { useState } from 'react';

import type { Settings } from './config';
import type { PushNote } from './pushover';

/**
 * Parses "match = label" lines. Blank lines and lines without "=" are skipped.
 */
export function parseAliases(text: string) {
  return text
    .split('\n')
    .map((line) => line.split('='))
    .filter((parts) => parts.length >= 2)
    .map(([match, ...label]) => ({ match: match.trim().toLowerCase(), label: label.join('=').trim() }))
    .filter(({ match, label }) => match && label);
}

/**
 * Swaps the title for the first alias whose match appears in the sending
 * app's name or the title (case-insensitive).
 */
export function applyAlias(note: PushNote, aliases: ReturnType<typeof parseAliases>): PushNote {
  const haystack = `${note.app ?? ''}\n${note.title}`.toLowerCase();
  const hit = aliases.find(({ match }) => haystack.includes(match));
  return hit ? { ...note, title: hit.label } : note;
}

const priorityOf = (note: PushNote) => note.priority ?? 0;

/** Priority -2 notifications are kept out of the lock screen (shown in Settings). */
export const isHidden = (note: PushNote, settings: Settings) =>
  settings.usePriority && priorityOf(note) <= -2;

/** Priority -1 and below arrive without waking, buzzing or speaking. */
export const isQuiet = (note: PushNote, settings: Settings) =>
  settings.usePriority && priorityOf(note) <= -1;

/** Whether a batch of new notifications should wake a dimmed screen. */
export function shouldWake(loud: PushNote[], settings: Settings) {
  if (loud.length === 0 || settings.dimStyle === 'off') return false;
  if (settings.wakeOnArrival === 'always') return true;
  if (settings.wakeOnArrival === 'priority') return loud.some((n) => priorityOf(n) >= 1);
  return false;
}

/** "3:30PM" from the time a notification arrived, for the event disguise. */
export function arrivalTime(note: PushNote) {
  const date = new Date((note.received ?? note.date) * 1000);
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return { clock: `${hours}:${minutes}`, period: date.getHours() < 12 ? 'AM' : 'PM' };
}

/**
 * Press handlers for a notification with "Hide message text" on: a tap
 * dismisses it, pressing and holding shows the message until you let go.
 */
export function usePeek(onDismiss: () => void) {
  const [peeking, setPeeking] = useState(false);
  return {
    peeking,
    pressProps: {
      onPress: onDismiss,
      onLongPress: () => setPeeking(true),
      onPressOut: () => setPeeking(false),
      delayLongPress: 250,
    },
  };
}
