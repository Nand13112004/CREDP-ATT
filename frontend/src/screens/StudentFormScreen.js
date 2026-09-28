import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch } from 'react-native';
import api, { getErrorMessage } from '../api/client';
import { Button, colors } from '../components/UI';

export default function StudentFormScreen({ route, navigation }) {
  const editingStudent = route.params?.student;
  const isEditing = !!editingStudent;

  const [studentId, setStudentId] = useState(editingStudent?.studentId || '');
  const [name, setName] = useState(editingStudent?.name || '');
  const [email, setEmail] = useState(editingStudent?.email || '');
  const [phone, setPhone] = useState(editingStudent?.phone || '');
  const [className, setClassName] = useState(editingStudent?.className || '');
  const [isActive, setIsActive] = useState(editingStudent?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = React.useRef(false);

  async function handleSave() {
    if (submittingRef.current || loading) return;
    setError('');

    if (!isEditing && !studentId.trim()) {
      setError('Student ID is required.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/students/${editingStudent._id}`, { name, email, phone, className, isActive });
      } else {
        await api.post('/students', { studentId, name, email, phone, className });
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
      <Text style={styles.label}>Student ID {isEditing && '(cannot be changed)'}</Text>
      <TextInput
        style={[styles.input, isEditing && styles.inputDisabled]}
        value={studentId}
        onChangeText={setStudentId}
        editable={!isEditing}
        placeholder="e.g. STU001"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Rahul Patel" />

      <Text style={styles.label}>Email (optional)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="e.g. rahul@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone (optional)</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="e.g. 9876543210" keyboardType="phone-pad" />

      <Text style={styles.label}>Class / Batch (optional)</Text>
      <TextInput style={styles.input} value={className} onChangeText={setClassName} placeholder="e.g. TY-CE" />

      {isEditing && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button title={isEditing ? 'Save Changes' : 'Add Student'} onPress={handleSave} loading={loading} style={{ marginTop: 20 }} />
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
