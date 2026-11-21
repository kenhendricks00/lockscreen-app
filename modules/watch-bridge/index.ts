import { requireOptionalNativeModule } from 'expo';

type Subscription = { remove(): void };
type WatchBridgeModule = {
  send(json: string, complication: boolean): void;
  addListener(event: 'onDismiss', listener: (event: { id: string }) => void): Subscription;
};

// Only exists in a real build; Expo Go and the web preview don't include it.
const WatchBridge = requireOptionalNativeModule<WatchBridgeModule>('WatchBridge');

export const canUseWatch = WatchBridge !== null;

/**
 * Sends the watch its whole state. Set `complication` only when a new
 * notification arrived: iOS budgets immediate complication refreshes.
 */
export function sendToWatch(state: object, complication: boolean) {
  WatchBridge?.send(JSON.stringify(state), complication);
}

/** Calls `listener` with the id of each notification dismissed on the watch. */
export function onWatchDismiss(listener: (id: string) => void): Subscription {
  return WatchBridge?.addListener('onDismiss', ({ id }) => listener(id)) ?? { remove() {} };
}
