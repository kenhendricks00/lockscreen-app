import { useFonts } from 'expo-font';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { keepAwake } from './src/config';
import { fontAssets } from './src/fonts';
import { LockScreen } from './src/LockScreen';

// Hooks can't be called conditionally, so the setting mounts this or not.
function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      {keepAwake && <KeepAwake />}
      {fontsLoaded && <LockScreen />}
    </SafeAreaProvider>
  );
}
