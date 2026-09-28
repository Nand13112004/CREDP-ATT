import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  bg: '#F3F4F6',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

export function DebouncedTouchable({ onPress, disabled, debounceMs = 500, children, ...props }) {
  const lastPressRef = React.useRef(0);

  const handlePress = (e) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastPressRef.current < debounceMs) return;
    lastPressRef.current = now;
    if (onPress) onPress(e);
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, debounceMs = 500, style }) {
  const lastPressRef = React.useRef(0);

  const handlePress = (e) => {
    if (disabled || loading) return;
    const now = Date.now();
    if (now - lastPressRef.current < debounceMs) return;
    lastPressRef.current = now;
    if (onPress) onPress(e);
  };

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'success'
      ? colors.success
      : variant === 'danger'
      ? colors.danger
      : variant === 'outline'
      ? 'transparent'
      : colors.primary;

  const textColor = variant === 'outline' ? colors.primary : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: bg },
        variant === 'outline' && styles.buttonOutline,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.mutedText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.mutedText}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>⚠️</Text>
      <Text style={[styles.mutedText, { color: colors.danger, textAlign: 'center' }]}>{message}</Text>
      {onRetry && <Button title="Retry" onPress={onRetry} style={{ marginTop: 12, width: 140 }} />}
    </View>
  );
}

export function Badge({ text, tone = 'default' }) {
  const bg =
    tone === 'success' ? '#DCFCE7' : tone === 'danger' ? '#FEE2E2' : tone === 'warning' ? '#FEF3C7' : '#E5E7EB';
  const fg =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  mutedText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 15,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
