
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the saved session on app startup.
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);

        if (!mounted) return;

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          setToken(storedToken);
          setUser(parsedUser);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('[AUTH] Failed to restore session:', error);

        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Sign in and persist the returned session.
  const login = useCallback(async (id, password) => {
    try {
      const res = await api.post('/auth/login', {
        id: String(id).trim(),
        password,
      });

      const newToken = res.data?.token;
      const newUser = res.data?.user;

      if (
        typeof newToken !== 'string' ||
        !newToken.trim() ||
        !newUser
      ) {
        console.error(
          '[AUTH] Login response is missing token or user.'
        );

        return {
          success: false,
          message: 'Invalid login response from the server.',
        };
      }

      // Save both values before updating the authenticated UI.
      await AsyncStorage.multiSet([
        ['token', newToken],
        ['user', JSON.stringify(newUser)],
      ]);

      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('[AUTH] Login failed:', {
        status: error.response?.status,
        message: getErrorMessage(error),
      });

      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }, []);

  // Clear the local session.
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
    } catch (error) {
      console.error('[AUTH] Failed to clear stored session:', error);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
    }),
    [user, token, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return ctx;
}
