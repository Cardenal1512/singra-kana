import { StyleSheet, Text, View } from 'react-native';

import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';

type PracticeSessionInsightCardProps = {
  correctCount: number;
  durationSeconds?: number;
  failedKana?: string[];
  language: 'en' | 'es';
  totalCount: number;
};

export function PracticeSessionInsightCard({
  correctCount,
  durationSeconds = 0,
  failedKana = [],
  language,
  totalCount,
}: PracticeSessionInsightCardProps) {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const uniqueFailedKana = Array.from(new Set(failedKana.filter(Boolean))).slice(0, 5);
  const singraImage = getMascotImage('singraGambate') ?? getMascotImage('singraHome');
  const message = getMessage({ accuracy, language, uniqueFailedKana });

  return (
    <View style={styles.card}>
      {singraImage ? (
        <View style={styles.singraBubble}>
          <AnimatedSingra mood={accuracy >= 80 ? 'happy' : 'thinking'} size={54} source={singraImage} />
        </View>
      ) : null}

      <View style={styles.copy}>
        <Text style={styles.label}>
          {language === 'es' ? 'Consejo de Singra' : 'Singra tip'}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.statsRow}>
          <Text style={styles.statPill}>{accuracy}%</Text>
          <Text style={styles.statPill}>{formatDuration(durationSeconds, language)}</Text>
          {uniqueFailedKana.length > 0 ? (
            <Text style={styles.statPill}>
              {language === 'es' ? `${uniqueFailedKana.length} a repasar` : `${uniqueFailedKana.length} to review`}
            </Text>
          ) : null}
        </View>

        {uniqueFailedKana.length > 0 ? (
          <View style={styles.kanaRow}>
            {uniqueFailedKana.map((kana) => (
              <Text key={kana} style={styles.kanaPill}>{kana}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getMessage({
  accuracy,
  language,
  uniqueFailedKana,
}: {
  accuracy: number;
  language: 'en' | 'es';
  uniqueFailedKana: string[];
}) {
  if (uniqueFailedKana.length > 0) {
    return language === 'es'
      ? `Buen trabajo. Ahora conviene repetir ${uniqueFailedKana.slice(0, 3).join(' · ')}.`
      : `Nice work. Now review ${uniqueFailedKana.slice(0, 3).join(' · ')}.`;
  }

  if (accuracy >= 95) {
    return language === 'es'
      ? 'Sesion brillante. Puedes pasar al siguiente reto.'
      : 'Brilliant session. You can move to the next challenge.';
  }

  if (accuracy >= 75) {
    return language === 'es'
      ? 'Vas muy bien. Un repaso corto consolidara esto.'
      : 'You are doing well. A short review will lock this in.';
  }

  return language === 'es'
    ? 'Paso a paso. Repetir la ronda hara que se quede.'
    : 'Step by step. Repeating the round will help it stick.';
}

function formatDuration(seconds: number, language: 'en' | 'es') {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return language === 'es' ? `${minutes} min` : `${minutes} min`;
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF7DB',
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    ...softShadow,
  },
  singraBubble: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  copy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  message: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kanaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  kanaPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 32,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
    textAlign: 'center',
  },
});
