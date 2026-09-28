import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { Card, Badge, LoadingState, ErrorState, EmptyState, Button, DebouncedTouchable, colors } from '../components/UI';

export default function VolunteersScreen({ navigation }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const deletingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/volunteers');
      setVolunteers(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  function confirmDelete(v) {
    if (deletingRef.current) return;
    Alert.alert('Delete Volunteer', `Delete ${v.name} (${v.volunteerId})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (deletingRef.current) return;
          deletingRef.current = true;
          try {
            await api.delete(`/volunteers/${v._id}`);
            load();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          } finally {
            deletingRef.current = false;
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingState message="Loading volunteers..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={volunteers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState message="No volunteers yet. Add one to get started." />}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.volunteerId} • {item.email}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Badge text={item.isActive ? 'Active' : 'Inactive'} tone={item.isActive ? 'success' : 'default'} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <DebouncedTouchable onPress={() => navigation.navigate('VolunteerForm', { volunteer: item })}>
                  <Text style={styles.link}>Edit</Text>
                </DebouncedTouchable>
                <DebouncedTouchable onPress={() => confirmDelete(item)}>
                  <Text style={[styles.link, { color: colors.danger }]}>Delete</Text>
                </DebouncedTouchable>
              </View>
            </View>
          </Card>
        )}
      />
      <View style={styles.fabWrap}>
        <Button title="+ Add Volunteer" onPress={() => navigation.navigate('VolunteerForm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13, paddingVertical: 4, paddingHorizontal: 6 },
  fabWrap: { padding: 16, paddingTop: 0 },
});
