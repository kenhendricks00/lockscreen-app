import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fontAssets } from './src/fonts';
import { LockScreen } from './src/LockScreen';
import { SettingsProvider } from './src/settings';

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <SettingsProvider>{fontsLoaded && <LockScreen />}</SettingsProvider>
    </SafeAreaProvider>
  );
}
