import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch } from 'react-native';
import api, { getErrorMessage } from '../api/client';
import { Button, colors } from '../components/UI';

export default function VolunteerFormScreen({ route, navigation }) {
  const editingVolunteer = route.params?.volunteer;
  const isEditing = !!editingVolunteer;

  const [volunteerId, setVolunteerId] = useState(editingVolunteer?.volunteerId || '');
  const [name, setName] = useState(editingVolunteer?.name || '');
  const [email, setEmail] = useState(editingVolunteer?.email || '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(editingVolunteer?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = React.useRef(false);

  async function handleSave() {
    if (submittingRef.current || loading) return;
    setError('');

    if (!isEditing && (!volunteerId.trim() || !name.trim() || !email.trim() || !password)) {
      setError('All fields are required for a new volunteer.');
      return;
    }
    if (!isEditing && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isEditing && password && password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      if (isEditing) {
        const body = { name, email, isActive };
        if (password) body.password = password;
        await api.put(`/volunteers/${editingVolunteer._id}`, body);
      } else {
        await api.post('/volunteers', { volunteerId, name, email, password });
      }
      navigation.goBack();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Volunteer ID {isEditing && '(cannot be changed)'}</Text>
      <TextInput
        style={[styles.input, isEditing && styles.inputDisabled]}
        value={volunteerId}
        onChangeText={setVolunteerId}
        editable={!isEditing}
        placeholder="e.g. VOL001"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Priya Shah" />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="e.g. priya@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
      />

      {isEditing && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button title={isEditing ? 'Save Changes' : 'Add Volunteer'} onPress={handleSave} loading={loading} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  inputDisabled: { backgroundColor: '#EEE', color: colors.textMuted },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  error: { color: colors.danger, marginTop: 14, fontSize: 14 },
});
