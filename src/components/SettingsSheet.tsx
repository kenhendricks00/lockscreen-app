import { type ReactNode, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import type { Placement } from '../config';
import { sans } from '../fonts';
import { deleteWallpaper, pickWallpaper, useSettings } from '../settings';
import { findCity } from '../weather';

const PLACEMENTS: { value: Placement; label: string }[] = [
  { value: 'edge', label: 'Left edge' },
  { value: 'weather', label: 'Weather spot' },
  { value: 'event', label: 'Event line' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor="#8e8e93" style={styles.input} {...props} />;
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

/** Everything personal, set on the phone. Opened by long-pressing the lock screen. */
export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, update } = useSettings();
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
            <View style={styles.buttons}>
              <Button label="Choose photo" onPress={chooseWallpaper} />
              {settings.wallpaper && <Button label="Use default" onPress={resetWallpaper} />}
            </View>
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
            <View style={styles.buttons}>
              <Field
                placeholder="City"
                value={city}
                onChangeText={setCity}
                onSubmitEditing={searchCity}
                returnKeyType="search"
                style={[styles.input, styles.grow]}
              />
              <Button label="Set" onPress={searchCity} />
            </View>
            {cityStatus !== '' && <Text style={styles.hint}>{cityStatus}</Text>}
          </Section>

          <Section title="Pushover notifications">
            <View style={styles.segments}>
              {PLACEMENTS.map(({ value, label }) => (
                <Pressable
                  key={value}
                  onPress={() => update({ placement: value })}
                  style={[styles.segment, settings.placement === value && styles.segmentOn]}
                >
                  <Text style={styles.segmentText}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Toggle
              label="Show sample notifications"
              value={settings.demoNotifications}
              onChange={(demoNotifications) => update({ demoNotifications })}
            />
          </Section>

          <Section title="Display">
            <Toggle
              label="Keep screen awake"
              value={settings.keepAwake}
              onChange={(keepAwake) => update({ keepAwake })}
            />
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
  section: { gap: 8 },
  sectionTitle: { ...sans('500'), fontSize: 13, color: '#8e8e93', textTransform: 'uppercase' },
  card: { backgroundColor: '#2c2c2e', borderRadius: 12, padding: 12, gap: 10 },
  input: {
    ...sans('400'),
    fontSize: 16,
    color: 'white',
    backgroundColor: '#3a3a3c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  grow: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 10 },
  button: { backgroundColor: '#0a84ff', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', minHeight: 36 },
  pressed: { opacity: 0.7 },
  buttonText: { ...sans('600'), fontSize: 15, color: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...sans('400'), fontSize: 16, color: 'white' },
  hint: { ...sans('400'), fontSize: 13, color: '#8e8e93' },
  segments: { flexDirection: 'row', backgroundColor: '#3a3a3c', borderRadius: 9, padding: 2 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 7 },
  segmentOn: { backgroundColor: '#636366' },
  segmentText: { ...sans('500'), fontSize: 13, color: 'white' },
});
