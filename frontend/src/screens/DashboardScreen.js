import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, Button, LoadingState, ErrorState, colors } from '../components/UI';
import { todayISO, formatDateLong } from '../utils/date';

export default function DashboardScreen({ navigation }) {
  const { user, isAdmin, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [volunteerCount, setVolunteerCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const date = todayISO();
      const requests = [api.get(`/reports/daily?date=${date}`), api.get('/students?activeOnly=true')];
      if (isAdmin) requests.push(api.get('/volunteers'));

      const results = await Promise.all(requests);
      setReport(results[0].data);
      setStudentCount(results[1].data.length);
      if (isAdmin) setVolunteerCount(results[2].data.length);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Hi, {user?.name} 👋</Text>
      <Text style={styles.date}>{formatDateLong(todayISO())}</Text>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{studentCount ?? '-'}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </Card>
        {isAdmin && (
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{volunteerCount ?? '-'}</Text>
            <Text style={styles.statLabel}>Total Volunteers</Text>
          </Card>
        )}
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>{report?.present ?? 0}</Text>
          <Text style={styles.statLabel}>Today's Present</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{report?.absent ?? 0}</Text>
          <Text style={styles.statLabel}>Today's Absent</Text>
        </Card>
        <Card style={[styles.statCard, { flexBasis: '100%' }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{report?.percentage ?? 0}%</Text>
          <Text style={styles.statLabel}>Today's Attendance</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        <Button title="📋 Mark Attendance" onPress={() => navigation.navigate('MarkAttendance')} />
        {isAdmin && (
          <Button title="📋 Mark Volunteer Attendance" variant="outline" onPress={() => navigation.navigate('MarkVolunteerAttendance')} style={{ marginTop: 10 }} />
        )}
        <Button title="🧑‍🎓 Students" variant="outline" onPress={() => navigation.navigate('Students')} style={{ marginTop: 10 }} />
        {isAdmin && (
          <Button title="🙋 Volunteers" variant="outline" onPress={() => navigation.navigate('Volunteers')} style={{ marginTop: 10 }} />
        )}
        <Button title="📊 Reports" variant="outline" onPress={() => navigation.navigate('Reports')} style={{ marginTop: 10 }} />
        <Button title="🚪 Logout" variant="danger" onPress={logout} style={{ marginTop: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexBasis: '47%', alignItems: 'center', paddingVertical: 20 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 10 },
  actions: { marginBottom: 20 },
});
