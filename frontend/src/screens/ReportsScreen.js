import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { Card, Badge, LoadingState, ErrorState, EmptyState, DebouncedTouchable, colors } from '../components/UI';
import { todayISO, formatDateLong } from '../utils/date';

export default function ReportsScreen({ navigation }) {
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activeRequestIdRef = useRef(0);

  const load = useCallback(async (d) => {
    const reqId = ++activeRequestIdRef.current;
    try {
      setError('');
      const res = await api.get('/reports/daily', { params: { date: d } });
      if (reqId === activeRequestIdRef.current) {
        setReport(res.data);
      }
    } catch (err) {
      if (reqId === activeRequestIdRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(date);
    }, [load, date])
  );

  function shiftDate(days) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().slice(0, 10);
    setDate(newDate);
    setLoading(true);
    load(newDate);
  }

  const filteredStudents = (report?.students || []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q);
  });

  if (loading) return <LoadingState message="Loading reports..." />;
  if (error) return <ErrorState message={error} onRetry={() => load(date)} />;

  return (
    <View style={styles.screen}>
      <View style={styles.dateBar}>
        <DebouncedTouchable onPress={() => shiftDate(-1)} debounceMs={300} style={styles.dateArrow}>
          <Text style={styles.dateArrowText}>‹</Text>
        </DebouncedTouchable>
        <Text style={styles.dateText}>{formatDateLong(date)}</Text>
        <DebouncedTouchable onPress={() => shiftDate(1)} debounceMs={300} style={styles.dateArrow}>
          <Text style={styles.dateArrowText}>›</Text>
        </DebouncedTouchable>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Card>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{report?.totalStudents ?? 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{report?.present ?? 0}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{report?.absent ?? 0}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{report?.percentage ?? 0}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </Card>

        <TextInput
          style={styles.searchInput}
          placeholder="Search student..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.studentId}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={<EmptyState message="No students found." />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        renderItem={({ item }) => (
          <DebouncedTouchable
            onPress={() => navigation.navigate('StudentDetail', { studentId: item.studentId, name: item.name })}
          >
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.studentId}</Text>
              </View>
              <Badge
                text={item.status}
                tone={item.status === 'Present' ? 'success' : item.status === 'Absent' ? 'danger' : 'warning'}
              />
            </Card>
          </DebouncedTouchable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 20,
  },
  dateArrow: { paddingHorizontal: 14, paddingVertical: 4 },
  dateArrowText: { fontSize: 26, color: colors.primary, fontWeight: '700' },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 180, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 12,
  },
  row: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
