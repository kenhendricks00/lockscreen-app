import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type Glyph = ComponentProps<typeof MaterialCommunityIcons>['name'];

// Generic app-style icons the list notifications can wear instead of the
// sending app's own Pushover icon ('app').
export const noteIcons = {
  bell: { glyph: 'bell', color: '#0a84ff' },
  message: { glyph: 'message-text', color: '#34c759' },
  mail: { glyph: 'email', color: '#0a84ff' },
  calendar: { glyph: 'calendar-blank', color: '#ff3b30' },
  home: { glyph: 'home', color: '#ff9f0a' },
  alert: { glyph: 'alert', color: '#ff453a' },
  star: { glyph: 'star', color: '#ffcc00' },
  heart: { glyph: 'heart', color: '#ff2d55' },
} satisfies Record<string, { glyph: Glyph; color: string }>;

export type NoteIcon = 'app' | keyof typeof noteIcons;
