import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, Card, colors } from '../components/UI';
import { isValidDateString, todayISO } from '../utils/date';

const MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function downloadInBrowser(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportScreen() {
  const { isAdmin } = useAuth();
  const today = todayISO();
  const [fromDate, setFromDate] = useState(`${today.slice(0, 8)}01`);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function exportData() {
    if (!isAdmin) {
      setError('Only admins can export attendance data.');
      return;
    }
    if (!isValidDateString(fromDate) || !isValidDateString(toDate)) {
      setError('Enter both dates in YYYY-MM-DD format.');
      return;
    }
    if (fromDate > toDate) {
      setError('The start date must be earlier than or equal to the end date.');
      return;
    }
    if (toDate > today) {
      setError('The end date cannot be in the future.');
      return;
    }

    setLoading(true);
    setError('');
    const filename = `attendance-export-${fromDate}-to-${toDate}.xlsx`;

    try {
      const params = { from: fromDate, to: toDate };

      if (Platform.OS === 'web') {
        const response = await api.get('/reports/export', { params, responseType: 'blob' });
        downloadInBrowser(new Blob([response.data], { type: MIME_TYPE }), filename);
      } else {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Your session has expired. Please log in again.');

        const query = `from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
        const destination = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
        const result = await FileSystem.downloadAsync(
          `${api.defaults.baseURL}/reports/export?${query}`,
          destination,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (result.status < 200 || result.status >= 300) {
          await FileSystem.deleteAsync(result.uri, { idempotent: true });
          throw new Error(
            result.status === 401
              ? 'Your session has expired. Please log in again.'
              : result.status === 403
                ? 'Only admins can export attendance data.'
                : 'The server could not create the Excel export.'
          );
        }
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error('File sharing is not available on this device.');
        }

        await Sharing.shareAsync(result.uri, {
          mimeType: MIME_TYPE,
          dialogTitle: 'Save attendance export',
          UTI: 'org.openxmlformats.spreadsheetml.sheet',
        });
      }
    } catch (err) {
      setError(err.response ? getErrorMessage(err) : err.message || 'Unable to export attendance data.');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Only admins can export attendance data.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Export attendance data</Text>
        <Text style={styles.description}>
          Choose a date range to download a formatted Excel workbook with daily summaries and
          student and volunteer attendance details.
        </Text>

        <View style={styles.dateFields}>
          <View style={styles.dateField}>
            <Text style={styles.label}>From date</Text>
            <TextInput
              accessibilityLabel="From date"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={fromDate}
              onChangeText={setFromDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>To date</Text>
            <TextInput
              accessibilityLabel="To date"
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={toDate}
              onChangeText={setToDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.hint}>
          The workbook includes daily totals and a row for every active student and volunteer
          on each selected date, including anyone not marked.
        </Text>
        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
        <Button
          title="Download Excel"
          onPress={exportData}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  dateFields: { flexDirection: 'row', gap: 12, marginTop: 24 },
  dateField: { flex: 1 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 16 },
  errorText: { color: colors.danger, textAlign: 'center', marginTop: 12 },
  button: { marginTop: 20 },
  centered: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
});
