import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, LoadingState, ErrorState, EmptyState, Button, DebouncedTouchable, colors } from '../components/UI';

export default function StudentsScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef(null);
  const deletingRef = useRef(false);

  const loadStudents = useCallback(async (q) => {
    try {
      setError('');
      const res = await api.get('/students', { params: q ? { search: q } : {} });
      setStudents(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadStudents(search);
    }, [loadStudents])
  );

  function handleSearchChange(text) {
    setSearch(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadStudents(text);
    }, 350);
  }

  function confirmDelete(student) {
    if (deletingRef.current) return;
    Alert.alert(
      'Delete Student',
      `Delete ${student.name} (${student.studentId})? This also removes their attendance history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (deletingRef.current) return;
            deletingRef.current = true;
            try {
              await api.delete(`/students/${student._id}`);
              loadStudents(search);
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            } finally {
              deletingRef.current = false;
            }
          },
        },
      ]
    );
  }

  if (loading) return <LoadingState message="Loading students..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadStudents(search)} />;

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search student by name or ID..."
          value={search}
          onChangeText={handleSearchChange}
        />
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
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
                <Text style={styles.meta}>
                  {item.studentId}
                  {item.className ? ` • ${item.className}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Badge text={item.isActive ? 'Active' : 'Inactive'} tone={item.isActive ? 'success' : 'default'} />
                {isAdmin && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <DebouncedTouchable onPress={() => navigation.navigate('StudentForm', { student: item })}>
                      <Text style={styles.link}>Edit</Text>
                    </DebouncedTouchable>
                    <DebouncedTouchable onPress={() => confirmDelete(item)}>
                      <Text style={[styles.link, { color: colors.danger }]}>Delete</Text>
                    </DebouncedTouchable>
                  </View>
                )}
              </View>
            </Card>
          </DebouncedTouchable>
        )}
      />

      {isAdmin && (
        <View style={styles.fabWrap}>
          <Button title="+ Add Student" onPress={() => navigation.navigate('StudentForm')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 16, paddingBottom: 0 },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13, paddingVertical: 4, paddingHorizontal: 6 },
  fabWrap: { padding: 16, paddingTop: 0 },
});
