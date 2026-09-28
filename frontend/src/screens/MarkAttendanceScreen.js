import React, { useCallback, useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { Button, LoadingState, ErrorState, EmptyState, colors } from '../components/UI';
import { todayISO, formatDateLong } from '../utils/date';

// Memoized row component to avoid re-rendering entire list on each status click
const StudentRow = memo(function StudentRow({ item, status, onToggle, disabled }) {
  return (
    <View style={styles.studentRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentMeta}>{item.studentId}</Text>
      </View>
      <View style={styles.statusButtons}>
        <TouchableOpacity
          onPress={() => onToggle(item.studentId, 'Present')}
          disabled={disabled}
          activeOpacity={0.7}
          style={[styles.statusBtn, status === 'Present' && styles.presentActive]}
        >
          <Text style={[styles.statusBtnText, status === 'Present' && styles.statusBtnTextActive]}>P</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggle(item.studentId, 'Absent')}
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

export default function MarkAttendanceScreen() {
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // studentId -> 'Present' | 'Absent' | undefined
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savingRef = useRef(false);
  const date = todayISO();

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get('/students', { params: { activeOnly: 'true' } }),
        api.get('/attendance', { params: { date } }),
      ]);

      setStudents(studentsRes.data);

      const map = {};
      for (const record of attendanceRes.data.records) {
        map[record.studentId] = record.status;
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

  const toggleStatus = useCallback((studentId, status) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
  });

  function markAllPresent() {
    if (savingRef.current) return;
    const map = {};
    for (const s of filteredStudents) map[s.studentId] = 'Present';
    setStatusMap((prev) => ({ ...prev, ...map }));
  }

  function clearAll() {
    if (savingRef.current) return;
    setStatusMap({});
  }

  async function saveAttendance() {
    if (savingRef.current || saving) return;

    const records = students
      .filter((s) => statusMap[s.studentId])
      .map((s) => ({ studentId: s.studentId, status: statusMap[s.studentId] }));

    if (records.length === 0) {
      Alert.alert('Nothing to save', 'Mark at least one student as Present or Absent first.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await api.post('/attendance', { date, records });
      Alert.alert('Success', 'Attendance saved successfully.');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading students..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Attendance</Text>
        <Text style={styles.date}>{formatDateLong(date)}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        ListEmptyComponent={<EmptyState message="No active students found." />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        renderItem={({ item }) => (
          <StudentRow
            item={item}
            status={statusMap[item.studentId]}
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
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  studentName: { fontSize: 15, fontWeight: '700', color: colors.text },
  studentMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
