import { useState } from 'react';

import { type PushoverAccount, signIn } from '../pushover';
import { Button, Field, Hint } from './SettingsControls';

/** Email + password (+ two-factor code if asked) -> a registered Pushover device. */
export function PushoverSignIn({ onConnect }: { onConnect: (account: PushoverAccount) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [status, setStatus] = useState('');

  const connect = async () => {
    setStatus('Connecting…');
    try {
      const result = await signIn(email.trim(), password, code.trim());
      if (result === 'needs-2fa') {
        setNeedsCode(true);
        setStatus('Enter the two-factor code from your authenticator app.');
        return;
      }
      setPassword('');
      onConnect(result);
    } catch (error) {
      // fetch throws a TypeError when the request never reaches Pushover.
      if (error instanceof TypeError) setStatus("Couldn't reach Pushover. Check your connection.");
      else setStatus(error instanceof Error ? error.message : "Couldn't connect.");
    }
  };

  return (
    <>
      <Field
        placeholder="Pushover email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
      />
      <Field
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
      />
      {needsCode && (
        <Field
          placeholder="Two-factor code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
        />
      )}
      <Button label="Connect" onPress={connect} />
      {status !== '' && <Hint>{status}</Hint>}
    </>
  );
}
