import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import {
  Inter_200ExtraLight,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { Oswald_500Medium } from '@expo-google-fonts/oswald';
import { Platform, type TextStyle } from 'react-native';

export const fontAssets = {
  Fraunces_500Medium,
  Inter_200ExtraLight,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Nunito_800ExtraBold,
  Oswald_500Medium,
};

const isIOS = Platform.OS === 'ios';

export type ClockFont = 'serif' | 'bold' | 'rounded' | 'thin' | 'narrow';
type ClockFontStyle = { label: string; family?: string; weight?: '200' | '600'; size: number };

// Sizes give every font the same digit height (~91 pt), so the layout never
// shifts. "Bold" and "Thin" use San Francisco on iPhone, like the real lock
// screen, and Inter elsewhere.
export const clockFonts: Record<ClockFont, ClockFontStyle> = {
  serif: { label: 'Serif', family: 'Fraunces_500Medium', size: 126 },
  bold: isIOS ? { label: 'Bold', weight: '600', size: 129 } : { label: 'Bold', family: 'Inter_700Bold', size: 124 },
  rounded: { label: 'Rounded', family: 'Nunito_800ExtraBold', size: 127 },
  thin: isIOS ? { label: 'Thin', weight: '200', size: 129 } : { label: 'Thin', family: 'Inter_200ExtraLight', size: 125 },
  narrow: { label: 'Narrow', family: 'Oswald_500Medium', size: 112 },
};

const inter = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
} as const;

/** San Francisco on iPhone; Inter elsewhere (web preview, Android) as a lookalike. */
export function sans(weight: keyof typeof inter): TextStyle {
  return isIOS ? { fontWeight: weight } : { fontFamily: inter[weight] };
}
