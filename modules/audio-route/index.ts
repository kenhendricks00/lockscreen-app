import { requireOptionalNativeModule } from 'expo';

type AudioRouteModule = { isHeadphonesConnected(): boolean };

// Only exists in a real build; Expo Go and the web preview don't include it.
const AudioRoute = requireOptionalNativeModule<AudioRouteModule>('AudioRoute');

export const canDetectHeadphones = AudioRoute !== null;

/** Whether audio is currently going to headphones (false if it can't tell). */
export function headphonesConnected() {
  return AudioRoute?.isHeadphonesConnected() ?? false;
}
