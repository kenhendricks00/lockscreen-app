import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Placement, ReadAloud } from '../config';
import { type ClockFont, clockFonts, sans } from '../fonts';
import { deleteWallpaper, pickWallpaper, useSettings } from '../settings';
import { canDetectHeadphones, previewReadAloud } from '../speech';
import { type NoteIcon, noteIcons } from '../noteIcons';
import { findCity } from '../weather';
import { AppIcon } from './NoteList';
import { PushoverSignIn } from './PushoverSignIn';
import { Button, Field, formStyles, Hint, Section, Segments, Toggle } from './SettingsControls';

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

/** Everything personal, set on the phone. Opened by long-pressing the lock screen. */
export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
                previewReadAloud(readAloudMode);
              }}
            />
            {settings.readAloudMode === 'headphones' && (
              <Hint>
                {canDetectHeadphones
                  ? 'Only while wired or Bluetooth headphones are connected. CarPlay doesn’t count.'
                  : 'Expo Go can’t detect headphones, so this stays quiet here. It works in the installed app.'}
              </Hint>
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
              </>
            )}
            <Hint>
              The screen stays on either way. While dimmed, a tap or a new Pushover notification wakes
              it.
            </Hint>
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
});
