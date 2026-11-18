// Small iOS-style form pieces shared by the Settings sheet.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, type TextInputProps, View } from 'react-native';

import { sans } from '../fonts';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Field({ style, ...props }: TextInputProps) {
  return <TextInput placeholderTextColor="#8e8e93" style={[styles.input, style]} {...props} />;
}

export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

export const formStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1 },
  label: { ...sans('400'), fontSize: 16, color: 'white' },
});

const styles = StyleSheet.create({
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
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
  },
  pressed: { opacity: 0.7 },
  buttonText: { ...sans('600'), fontSize: 15, color: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...sans('400'), fontSize: 16, color: 'white' },
  hint: { ...sans('400'), fontSize: 13, color: '#8e8e93' },
});
