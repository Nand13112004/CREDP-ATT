import React, { useCallback, useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { Button, LoadingState, ErrorState, EmptyState, colors } from '../components/UI';
import { todayISO, formatDateLong } from '../utils/date';

// Memoized row component to avoid re-rendering entire list on each status click
const VolunteerRow = memo(function VolunteerRow({ item, status, onToggle, disabled }) {
  return (
    <View style={styles.volunteerRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.volunteerName}>{item.name}</Text>
        <Text style={styles.volunteerMeta}>{item.volunteerId} • {item.email}</Text>
      </View>
      <View style={styles.statusButtons}>
        <TouchableOpacity
          onPress={() => onToggle(item.volunteerId, 'Present')}
          disabled={disabled}
          activeOpacity={0.7}
          style={[styles.statusBtn, status === 'Present' && styles.presentActive]}
        >
          <Text style={[styles.statusBtnText, status === 'Present' && styles.statusBtnTextActive]}>P</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggle(item.volunteerId, 'Absent')}
          disabled={disabled}
          activeOpacity={0.7}
          style={[styles.statusBtn, status === 'Absent' && styles.absentActive]}
        >
          <Text style={[styles.statusBtnText, status === 'Absent' && styles.statusBtnTextActive]}>A</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function MarkVolunteerAttendanceScreen() {
  const [volunteers, setVolunteers] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // volunteerId -> 'Present' | 'Absent' | undefined
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const date = todayISO();

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [volunteersRes, attendanceRes] = await Promise.all([
        api.get('/volunteers', { params: { activeOnly: 'true' } }),
        api.get('/attendance/volunteers', { params: { date } }),
      ]);

      setVolunteers(volunteersRes.data);

      const map = {};
      for (const record of attendanceRes.data.records) {
        map[record.volunteerId] = record.status;
      }
      setStatusMap(map);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const toggleStatus = useCallback((volunteerId, status) => {
    setStatusMap((prev) => ({ ...prev, [volunteerId]: status }));
  }, []);

  const filteredVolunteers = volunteers.filter((v) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return v.name.toLowerCase().includes(q) || v.volunteerId.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  function markAllPresent() {
    if (savingRef.current) return;
    const map = {};
    for (const v of filteredVolunteers) map[v.volunteerId] = 'Present';
    setStatusMap((prev) => ({ ...prev, ...map }));
  }

  function clearAll() {
    if (savingRef.current) return;
    setStatusMap({});
  }

  async function saveAttendance() {
    if (savingRef.current || saving) return;

    const records = volunteers
      .filter((v) => statusMap[v.volunteerId])
      .map((v) => ({ volunteerId: v.volunteerId, status: statusMap[v.volunteerId] }));

    if (records.length === 0) {
      Alert.alert('Nothing to save', 'Mark at least one volunteer as Present or Absent first.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await api.post('/attendance/volunteers', { date, records });
      Alert.alert('Success', 'Volunteer attendance saved successfully.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading volunteers..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Volunteer Attendance</Text>
        <Text style={styles.date}>{formatDateLong(date)}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search volunteer..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredVolunteers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        ListEmptyComponent={<EmptyState message="No active volunteers found." />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        renderItem={({ item }) => (
          <VolunteerRow
            item={item}
            status={statusMap[item.volunteerId]}
            onToggle={toggleStatus}
            disabled={saving}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <Button
            title="Mark All Present"
            variant="outline"
            onPress={markAllPresent}
            disabled={saving}
            style={{ flex: 1 }}
          />
          <Button
            title="Clear"
            variant="outline"
            onPress={clearAll}
            disabled={saving}
            style={{ flex: 1 }}
          />
        </View>
        <Button title="Save Attendance" onPress={saveAttendance} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: 12 },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  volunteerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  volunteerMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentActive: { backgroundColor: colors.success, borderColor: colors.success },
  absentActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  statusBtnText: { fontSize: 16, fontWeight: '800', color: colors.textMuted },
  statusBtnTextActive: { color: '#FFFFFF' },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
