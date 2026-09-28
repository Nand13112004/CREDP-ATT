import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { Card, Badge, LoadingState, ErrorState, EmptyState, colors } from '../components/UI';
import { formatDateLong } from '../utils/date';

export default function StudentDetailScreen({ route }) {
  const { studentId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await api.get(`/attendance/student/${studentId}`);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading) return <LoadingState message="Loading student report..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <View style={{ padding: 16 }}>
        <Card>
          <Text style={styles.name}>{data.student.name}</Text>
          <Text style={styles.meta}>
            {data.student.studentId}
            {data.student.className ? ` • ${data.student.className}` : ''}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{data.totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{data.presentDays}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{data.absentDays}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{data.percentage}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Date-wise History</Text>

      <FlatList
        data={data.history}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={<EmptyState message="No attendance history yet." />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        renderItem={({ item }) => (
          <Card style={styles.historyRow}>
            <Text style={styles.historyDate}>{formatDateLong(item.date)}</Text>
            <Badge text={item.status} tone={item.status === 'Present' ? 'success' : 'danger'} />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
