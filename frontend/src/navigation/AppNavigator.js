import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors, LoadingState } from '../components/UI';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsScreen from '../screens/StudentsScreen';
import StudentFormScreen from '../screens/StudentFormScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import VolunteersScreen from '../screens/VolunteersScreen';
import VolunteerFormScreen from '../screens/VolunteerFormScreen';
import MarkAttendanceScreen from '../screens/MarkAttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.bg },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Loading..." />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In', headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
            <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ title: 'Mark Attendance' }} />
            <Stack.Screen name="Students" component={StudentsScreen} options={{ title: 'Students' }} />
            <Stack.Screen
              name="StudentForm"
              component={StudentFormScreen}
              options={({ route }) => ({ title: route.params?.student ? 'Edit Student' : 'Add Student' })}
            />
            <Stack.Screen
              name="StudentDetail"
              component={StudentDetailScreen}
              options={({ route }) => ({ title: route.params?.name || 'Student Report' })}
            />
            <Stack.Screen name="Volunteers" component={VolunteersScreen} options={{ title: 'Volunteers' }} />
            <Stack.Screen
              name="VolunteerForm"
              component={VolunteerFormScreen}
              options={({ route }) => ({ title: route.params?.volunteer ? 'Edit Volunteer' : 'Add Volunteer' })}
            />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
