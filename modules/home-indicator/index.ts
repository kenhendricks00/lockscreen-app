import { requireOptionalNativeModule } from 'expo';

type HomeIndicatorModule = { setAutoHidden(hidden: boolean): void };

// Only exists in a real build; Expo Go and the web preview don't include it.
const HomeIndicator = requireOptionalNativeModule<HomeIndicatorModule>('HomeIndicator');

/** Lets iOS hide the home indicator a few seconds after the last touch. */
export function setHomeIndicatorAutoHidden(hidden: boolean) {
  HomeIndicator?.setAutoHidden(hidden);
}
