import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Platform, type TextStyle } from 'react-native';

export const fontAssets = {
  Fraunces_500Medium,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

export const clockFont = 'Fraunces_500Medium';

const inter = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
} as const;

/** San Francisco on iPhone; Inter elsewhere (web preview, Android) as a lookalike. */
export function sans(weight: keyof typeof inter): TextStyle {
  return Platform.OS === 'ios' ? { fontWeight: weight } : { fontFamily: inter[weight] };
}
