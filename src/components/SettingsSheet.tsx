import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  type DimStyle,
  type OffColor,
  type OffNoteStyle,
  originalBehavior,
  type Placement,
  type ReadAloud,
  type SpeakDetail,
  stealthPreset,
  type WakeOnArrival,
  type WatchComplication,
  type WatchScreen,
} from '../config';
import { canUseWatch } from '../../modules/watch-bridge';
import { type ClockFont, clockFonts, sans } from '../fonts';
import { deleteWallpaper, pickWallpaper, useSettings } from '../settings';
import { canDetectHeadphones, previewReadAloud } from '../speech';
import { type NoteIcon, noteIcons } from '../noteIcons';
import type { PushNote } from '../pushover';
import { findCity } from '../weather';
import { AppIcon } from './NoteList';
import { PushoverSignIn } from './PushoverSignIn';
import { Button, Field, formStyles, Hint, Section, Segments, Slider, Toggle } from './SettingsControls';

/** 1 -> "1x", 1.5 -> "1.5x", 1.25 -> "1.25x". */
const formatRate = (rate: number) => `${Number(rate.toFixed(2))}x`;

const PLACEMENTS: { value: Placement; label: string }[] = [
  { value: 'edge', label: 'Edge' },
  { value: 'weather', label: 'Weather' },
  { value: 'event', label: 'Event' },
  { value: 'list', label: 'List' },
];

const NOTE_ICONS: { value: NoteIcon; label: string }[] = [
  { value: 'app', label: 'App' },
  ...(Object.keys(noteIcons) as NoteIcon[]).map((value) => ({
    value,
    label: value[0].toUpperCase() + value.slice(1),
  })),
];

const READ_ALOUD: { value: ReadAloud; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'always', label: 'Always' },
  { value: 'headphones', label: 'Headphones' },
];

const SPEAK_DETAIL: { value: SpeakDetail; label: string }[] = [
  { value: 'full', label: 'Everything' },
  { value: 'title', label: 'Title only' },
  { value: 'private', label: 'Private' },
];

const WAKE_ON_ARRIVAL: { value: WakeOnArrival; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'priority', label: 'High priority' },
  { value: 'never', label: 'Never' },
];

const AUTO_HIDE = [
  { value: 0, label: 'Off' },
  { value: 300, label: '5 min' },
  { value: 1800, label: '30 min' },
  { value: 3600, label: '1 hour' },
];

const DIM_STYLES: { value: DimStyle; label: string }[] = [
  { value: 'darken', label: 'Darken' },
  { value: 'off', label: 'Looks off' },
];

const OFF_NOTE_STYLES: { value: OffNoteStyle; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'dot', label: 'Dot, tap for text' },
];

const OFF_TEXT_SIZES = [26, 30, 34, 40].map((value) => ({ value, label: `${value} pt` }));
const OFF_GLOW = [0.2, 0.35, 0.5, 0.75, 1].map((value) => ({
  value,
  label: `${Math.round(value * 100)}%`,
}));

const OFF_COLORS: { value: OffColor; label: string }[] = [
  { value: 'gray', label: 'Gray' },
  { value: 'amber', label: 'Amber' },
  { value: 'red', label: 'Red' },
];

const WATCH_SCREENS: { value: WatchScreen; label: string }[] = [
  { value: 'normal', label: 'List' },
  { value: 'off', label: 'Looks off' },
];

const WATCH_COMPLICATIONS: { value: WatchComplication; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'count', label: 'Count' },
  { value: 'dot', label: 'Dot' },
];

const CLOCK_FONTS = (Object.keys(clockFonts) as ClockFont[]).map((value) => ({
  value,
  label: clockFonts[value].label,
}));

const DIM_DELAYS = [
  { value: 15, label: '15 sec' },
  { value: 30, label: '30 sec' },
  { value: 60, label: '1 min' },
  { value: 300, label: '5 min' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  hiddenNotes: PushNote[]; // Pushover priority -2, kept off the lock screen
  onDismiss: (note: PushNote) => void;
  onPreviewOff: () => void; // closes Settings and shows the "looks off" screen
};

/** Everything personal, set on the phone. Opened by long-pressing the lock screen. */
export function SettingsSheet({ visible, onClose, hiddenNotes, onDismiss, onPreviewOff }: Props) {
  const { settings, update, pushover, setPushover } = useSettings();
  const [city, setCity] = useState(settings.city);
  const [cityStatus, setCityStatus] = useState('');

  const chooseWallpaper = async () => {
    const uri = await pickWallpaper();
    if (!uri) return;
    deleteWallpaper(settings.wallpaper);
    update({ wallpaper: uri });
  };

  const resetWallpaper = () => {
    deleteWallpaper(settings.wallpaper);
    update({ wallpaper: null });
  };

  const searchCity = async () => {
    setCityStatus('Searching…');
    const found = await findCity(city).catch(() => null);
    if (!found) return setCityStatus("Couldn't find that city.");
    update(found);
    setCity(found.city);
    setCityStatus('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.heading}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Section title="Wallpaper">
            <View style={formStyles.row}>
              <Button label="Choose photo" onPress={chooseWallpaper} />
              {settings.wallpaper && <Button label="Use default" onPress={resetWallpaper} />}
            </View>
          </Section>

          <Section title="Clock font">
            <Segments
              options={CLOCK_FONTS}
              value={settings.clockFont}
              onChange={(clockFont) => update({ clockFont })}
            />
          </Section>

          <Section title="Next event (leave blank to hide)">
            <Field
              placeholder="Time, e.g. 3:30PM"
              value={settings.eventTime}
              onChangeText={(eventTime) => update({ eventTime })}
            />
            <Field
              placeholder="Title"
              value={settings.eventTitle}
              onChangeText={(eventTitle) => update({ eventTitle })}
            />
          </Section>

          <Section title="Verse">
            <Field
              placeholder="Reference"
              value={settings.verseReference}
              onChangeText={(verseReference) => update({ verseReference })}
            />
            <Field
              placeholder="Text"
              multiline
              value={settings.verseText}
              onChangeText={(verseText) => update({ verseText })}
            />
          </Section>

          <Section title="Weather city">
            <View style={formStyles.row}>
              <Field
                placeholder="City"
                value={city}
                onChangeText={setCity}
                onSubmitEditing={searchCity}
                returnKeyType="search"
                style={formStyles.grow}
              />
              <Button label="Set" onPress={searchCity} />
            </View>
            {cityStatus !== '' && <Hint>{cityStatus}</Hint>}
          </Section>

          <Section title="Pushover notifications">
            {pushover ? (
              <View style={formStyles.row}>
                <Text style={[formStyles.label, formStyles.grow]}>Connected</Text>
                <Button label="Disconnect" onPress={() => setPushover(null)} />
              </View>
            ) : (
              <PushoverSignIn onConnect={setPushover} />
            )}
            <Segments
              options={PLACEMENTS}
              value={settings.placement}
              onChange={(placement) => update({ placement })}
            />
            {settings.placement === 'list' && (
              <>
                <Text style={formStyles.label}>Notification icon</Text>
                <View style={styles.icons}>
                  {NOTE_ICONS.map(({ value, label }) => (
                    <Pressable
                      key={value}
                      onPress={() => update({ noteIcon: value })}
                      style={[styles.iconChoice, settings.noteIcon === value && styles.iconChosen]}
                    >
                      <AppIcon icon={value} pushoverIcon="default" />
                      <Text style={styles.iconLabel}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field
                  placeholder="Name on notifications (optional)"
                  value={settings.noteName}
                  onChangeText={(noteName) => update({ noteName })}
                />
              </>
            )}
            <Text style={formStyles.label}>Read new notifications aloud</Text>
            <Segments
              options={READ_ALOUD}
              value={settings.readAloudMode}
              onChange={(readAloudMode) => {
                update({ readAloudMode });
                previewReadAloud(readAloudMode, settings.speechRate);
              }}
            />
            {settings.readAloudMode === 'headphones' && (
              <Hint>
                {canDetectHeadphones
                  ? 'Only while wired or Bluetooth headphones are connected. CarPlay doesn’t count.'
                  : 'Expo Go can’t detect headphones, so this stays quiet here. It works in the installed app.'}
              </Hint>
            )}
            {settings.readAloudMode !== 'off' && (
              <>
                <Slider
                  label="Speed"
                  value={settings.speechRate}
                  min={0.5}
                  max={2}
                  step={0.05}
                  format={formatRate}
                  onChange={(speechRate) => update({ speechRate })}
                  onDone={(speechRate) => previewReadAloud(settings.readAloudMode, speechRate)}
                />
                <Text style={formStyles.label}>What’s read</Text>
                <Segments
                  options={SPEAK_DETAIL}
                  value={settings.speakDetail}
                  onChange={(speakDetail) => update({ speakDetail })}
                />
                {settings.speakDetail === 'private' && (
                  <Hint>
                    Says just “New notification” out loud. The full text is read only into headphones.
                  </Hint>
                )}
              </>
            )}
            <Toggle
              label="Show sample notifications"
              value={settings.demoNotifications}
              onChange={(demoNotifications) => update({ demoNotifications })}
            />
            <Hint>
              Unofficial Pushover client. Your password is only sent to Pushover to sign in; the app keeps
              just a device key, in the iPhone Keychain.
            </Hint>
          </Section>

          <Section title="Stealth">
            <View style={formStyles.row}>
              <Button label="Stealth mode" onPress={() => update(stealthPreset)} />
              <Button label="Restore original" onPress={() => update(originalBehavior)} />
            </View>
            <Hint>
              Stealth mode turns on everything below and makes the dimmed screen look off. Restore
              original puts all of it back the way the app first worked. Your wallpaper, Pushover
              sign-in and other settings aren’t touched.
            </Hint>

            {settings.dimStyle !== 'off' && (
              <>
                <Text style={formStyles.label}>Wake the screen for new notifications</Text>
                <Segments
                  options={WAKE_ON_ARRIVAL}
                  value={settings.wakeOnArrival}
                  onChange={(wakeOnArrival) => update({ wakeOnArrival })}
                />
                {settings.wakeOnArrival === 'priority' && (
                  <Hint>Only Pushover priority 1 (high) and 2 (emergency) wake it.</Hint>
                )}
              </>
            )}

            <Toggle
              label="Follow Pushover priority"
              value={settings.usePriority}
              onChange={(usePriority) => update({ usePriority })}
            />
            {settings.usePriority && (
              <Hint>
                Priority −1 shows without waking, buzzing or speaking. Priority −2 stays off the lock
                screen and is listed here instead.
              </Hint>
            )}

            <Toggle
              label="Disguise notifications"
              value={settings.disguise}
              onChange={(disguise) => update({ disguise })}
            />
            {settings.disguise && (
              <Hint>
                No bell icons. In the event spot a notification looks like a calendar event, with its
                arrival time. Edge text is small and faint.
              </Hint>
            )}

            <Toggle
              label="Hide message text"
              value={settings.hideText}
              onChange={(hideText) => update({ hideText })}
            />
            {settings.hideText && (
              <Hint>Only the title shows. Press and hold a notification to read it; tap to dismiss.</Hint>
            )}

            <Toggle
              label="Buzz when one arrives"
              value={settings.haptic}
              onChange={(haptic) => update({ haptic })}
            />

            <Text style={formStyles.label}>Hide notifications after</Text>
            <Segments
              options={AUTO_HIDE}
              value={settings.autoHide}
              onChange={(autoHide) => update({ autoHide })}
            />

            <Toggle
              label="Keep notifications after restart"
              value={settings.rememberNotes}
              onChange={(rememberNotes) => update({ rememberNotes })}
            />
            {!settings.rememberNotes && (
              <Hint>Notifications are kept in memory only and are gone when the app closes.</Hint>
            )}

            <Text style={formStyles.label}>Rename senders</Text>
            <Field
              placeholder={'One per line, e.g.\nBank = Reminder\nRing = Home'}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              value={settings.aliases}
              onChangeText={(aliases) => update({ aliases })}
              style={styles.aliases}
            />
            <Hint>
              When the left side appears in the sending app’s name or the title, the title shows the
              right side instead. Read-aloud uses it too.
            </Hint>

            {settings.usePriority && hiddenNotes.length > 0 && (
              <>
                <Text style={formStyles.label}>Hidden notifications (priority −2)</Text>
                {hiddenNotes.map((note) => (
                  <Pressable key={note.id} onPress={() => onDismiss(note)} style={styles.hidden}>
                    <Text style={[formStyles.label, styles.hiddenTitle]}>{note.title}</Text>
                    <Text style={styles.hiddenMessage}>{note.message}</Text>
                  </Pressable>
                ))}
                <Hint>Tap one to dismiss it.</Hint>
              </>
            )}
          </Section>

          <Section title="Apple Watch">
            <Text style={formStyles.label}>Watch app screen</Text>
            <Segments
              options={WATCH_SCREENS}
              value={settings.watchScreen}
              onChange={(watchScreen) => update({ watchScreen })}
            />
            {settings.watchScreen === 'off' && (
              <Hint>
                Black, so the watch looks asleep, with the newest notification shown faintly at the
                Brightness set under Display. Tap it to peek at a hidden message; double tap for the
                full list.
              </Hint>
            )}
            <Text style={formStyles.label}>Watch face complication shows</Text>
            <Segments
              options={WATCH_COMPLICATIONS}
              value={settings.watchComplication}
              onChange={(watchComplication) => update({ watchComplication })}
            />
            <Hint>
              {canUseWatch
                ? 'Notifications reach the watch through this app, so it has to be open on the iPhone. The complication is hidden while the watch is locked.'
                : 'The watch app is only in the installed app, not in Expo Go.'}
            </Hint>
          </Section>

          <Section title="Display">
            <Toggle
              label="Show status bar"
              value={settings.statusBar}
              onChange={(statusBar) => update({ statusBar })}
            />
            {settings.statusBar && (
              <Field
                placeholder="Carrier name, e.g. T-Mobile"
                value={settings.carrier}
                onChangeText={(carrier) => update({ carrier })}
              />
            )}
            <Toggle
              label="Keep screen bright"
              value={settings.alwaysBright}
              onChange={(alwaysBright) => update({ alwaysBright })}
            />
            {!settings.alwaysBright && (
              <>
                <Text style={formStyles.label}>Dim after</Text>
                <Segments
                  options={DIM_DELAYS}
                  value={settings.dimAfter}
                  onChange={(dimAfter) => update({ dimAfter })}
                />
                <Text style={formStyles.label}>When dimmed</Text>
                <Segments
                  options={DIM_STYLES}
                  value={settings.dimStyle}
                  onChange={(dimStyle) => update({ dimStyle })}
                />
              </>
            )}
            {!settings.alwaysBright && settings.dimStyle === 'off' ? (
              <>
                <Hint>
                  The screen goes pure black, so an OLED iPhone looks switched off. The screen
                  brightness isn’t lowered, because black pixels give no light anyway; with
                  auto-brightness on, the text gets dimmer in a dark room by itself. The newest notification shows faintly; new ones never wake the screen. Double tap
                  to wake it. LCD iPhones (XR, 11, SE) glow gray instead.
                </Hint>
                <Text style={formStyles.label}>Notification on the black screen</Text>
                <Segments
                  options={OFF_NOTE_STYLES}
                  value={settings.offNoteStyle}
                  onChange={(offNoteStyle) => update({ offNoteStyle })}
                />
                <Text style={formStyles.label}>Text size</Text>
                <Segments
                  options={OFF_TEXT_SIZES}
                  value={settings.offTextSize}
                  onChange={(offTextSize) => update({ offTextSize })}
                />
                <Text style={formStyles.label}>Brightness</Text>
                <Segments
                  options={OFF_GLOW}
                  value={settings.offGlow}
                  onChange={(offGlow) => update({ offGlow })}
                />
                <Text style={formStyles.label}>Color</Text>
                <Segments
                  options={OFF_COLORS}
                  value={settings.offColor}
                  onChange={(offColor) => update({ offColor })}
                />
                <Button label="Preview" onPress={onPreviewOff} />
                <Hint>
                  Put the phone where you’ll use it, then raise the size and brightness until you can
                  read it, and no further. Double tap to leave the preview.
                </Hint>
              </>
            ) : (
              <Hint>
                The screen stays on either way. While dimmed, a tap wakes it; new Pushover notifications
                follow the Stealth settings.
              </Hint>
            )}
          </Section>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1c1c1e' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  heading: { ...sans('700'), fontSize: 28, color: 'white' },
  done: { ...sans('600'), fontSize: 17, color: '#0a84ff' },
  content: { padding: 20, paddingTop: 8, gap: 22 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconChoice: {
    width: 74,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconChosen: { borderColor: '#0a84ff', backgroundColor: 'rgba(10, 132, 255, 0.15)' },
  iconLabel: { ...sans('500'), fontSize: 12, color: 'white' },
  aliases: { minHeight: 70, textAlignVertical: 'top' },
  hidden: { backgroundColor: '#3a3a3c', borderRadius: 8, padding: 10, gap: 2 },
  hiddenTitle: { ...sans('600') },
  hiddenMessage: { ...sans('400'), fontSize: 14, color: '#c7c7cc' },
});
