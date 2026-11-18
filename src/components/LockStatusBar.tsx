import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BatteryState, getBatteryLevelAsync, usePowerState } from 'expo-battery';
import { NetworkStateType, useNetworkState } from 'expo-network';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { sans } from '../fonts';

const BAR_HEIGHTS = [4.5, 7, 9.5, 12];

// expo-battery's live hooks crash on web, so the web preview reads the level once.
function useWebPowerState() {
  const [batteryLevel, setBatteryLevel] = useState(-1);
  useEffect(() => {
    getBatteryLevelAsync().then(setBatteryLevel).catch(() => {});
  }, []);
  return { batteryLevel, batteryState: BatteryState.UNKNOWN, lowPowerMode: false };
}

const usePower = Platform.OS === 'web' ? useWebPowerState : usePowerState;

/**
 * The lock screen's own status bar: carrier, signal, Wi-Fi and battery.
 * Battery and Wi-Fi are live. iOS doesn't let apps read the carrier name or
 * signal strength, so the carrier comes from Settings and the bars stay full.
 */
export function LockStatusBar({ top, carrier }: { top: number; carrier: string }) {
  const { batteryLevel, batteryState, lowPowerMode } = usePower();
  const { type } = useNetworkState();

  return (
    <View style={[styles.bar, { top: top / 2 - 8 }]} pointerEvents="none">
      <Text style={styles.carrier} numberOfLines={1}>
        {carrier}
      </Text>
      <View>
        <View style={styles.icons}>
          <View style={styles.signal}>
            {BAR_HEIGHTS.map((height) => (
              <View key={height} style={[styles.signalBar, { height }]} />
            ))}
          </View>
          {type === NetworkStateType.WIFI && <MaterialCommunityIcons name="wifi" size={21} color="white" />}
          {batteryLevel >= 0 && (
            <Battery
              level={batteryLevel}
              charging={batteryState === BatteryState.CHARGING}
              lowPower={lowPowerMode}
            />
          )}
        </View>
        {/* The little Control Center grabber under the icons. */}
        <View style={styles.grabber} />
      </View>
    </View>
  );
}

function Battery({ level, charging, lowPower }: { level: number; charging: boolean; lowPower: boolean }) {
  const percent = Math.round(level * 100);
  const fill = charging ? '#34C759' : lowPower ? '#FFD60A' : percent <= 20 ? '#FF453A' : 'white';

  return (
    <View style={styles.battery}>
      <View style={styles.batteryBody}>
        <View style={[styles.batteryFill, { width: `${percent}%`, backgroundColor: fill }]} />
        <Text style={styles.batteryText}>{percent}</Text>
      </View>
      <View style={styles.batteryTip} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 44,
    right: 33,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carrier: { ...sans('500'), fontSize: 16.5, lineHeight: 21, color: 'white', flexShrink: 1 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 21 },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 },
  signalBar: { width: 4, borderRadius: 1.2, backgroundColor: 'white' },
  battery: { flexDirection: 'row', alignItems: 'center' },
  batteryBody: {
    width: 27,
    height: 14,
    borderRadius: 4.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
  },
  batteryFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  batteryText: {
    ...sans('700'),
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: 'rgba(20, 24, 50, 0.85)',
  },
  batteryTip: {
    width: 1.5,
    height: 4.5,
    marginLeft: 1,
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  grabber: {
    alignSelf: 'center',
    width: 60,
    height: 2.5,
    borderRadius: 1.25,
    marginTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});
