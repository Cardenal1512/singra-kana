import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { playSound } from '@/src/shared/audio/AudioService';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';

type PinLoginScreenProps = {
  isLoading?: boolean;
  onSubmit: (pin: string) => Promise<{ success: boolean; error?: string }>;
};

export function PinLoginScreen({ isLoading, onSubmit }: PinLoginScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = pin.length >= 4 && !isSubmitting && !isLoading;

  async function handleSubmit() {
    playSound('tap');

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const result = await onSubmit(pin);

      if (!result.success) {
        setError(result.error ?? 'PIN incorrecto. Prueba otra vez.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}>
      <KawaiiBackground kana={['あ', 'ア', '仮']} />
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Quién está practicando?</Text>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.profileTextGroup}>
              <Text style={styles.profileName}>Adri</Text>
              <Text style={styles.profileMeta}>Hiragana · principiante</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <TextInput
            accessibilityLabel="PIN"
            autoComplete="off"
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={12}
            placeholder="PIN"
            placeholderTextColor={colors.disabledText}
            secureTextEntry
            style={styles.input}
            value={pin}
            onChangeText={(value) => {
              setPin(value.replace(/\D/gu, ''));
              setError(undefined);
            }}
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.helper}>Introduce tu PIN</Text>}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.button,
              !canSubmit ? styles.buttonDisabled : null,
              pressed && canSubmit ? styles.buttonPressed : null,
            ]}
            onPress={handleSubmit}>
            <Text style={[styles.buttonText, !canSubmit ? styles.buttonTextDisabled : null]}>
              {isSubmitting || isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 24,
    maxWidth: 420,
    padding: 22,
    width: '100%',
    ...softShadow,
  },
  header: {
    gap: 18,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  profile: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  profileTextGroup: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  profileMeta: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.onPrimary,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    minHeight: 56,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  helper: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    minHeight: 18,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '800',
    minHeight: 18,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 22,
  },
  buttonDisabled: {
    backgroundColor: colors.disabledSurface,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  buttonTextDisabled: {
    color: colors.disabledText,
  },
});
