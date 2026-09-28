import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, colors } from '../components/UI';

export default function LoginScreen() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = React.useRef(false);

  async function handleLogin() {
    if (submittingRef.current || loading) return;
    setError('');

    if (!id.trim() || !password) {
      setError('Please enter your ID/Email and password.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const result = await login(id.trim(), password);
      if (!result.success) {
        setError(result.message);
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🎓</Text>
          <Text style={styles.appName}>Attendance App</Text>
          <Text style={styles.tagline}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Admin ID / Volunteer ID / Email</Text>
          <TextInput
            style={styles.input}
            value={id}
            onChangeText={setId}
            placeholder="e.g. admin or VOL001"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Button title="Login" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
          {loading && (
            <Text style={styles.hint}>Connecting to server... (may take ~30-50s if waking up on Render)</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoEmoji: {
    fontSize: 56,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FAFAFA',
  },
  error: {
    color: colors.danger,
    marginTop: 14,
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
