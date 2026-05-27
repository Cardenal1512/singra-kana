import { StyleSheet, Text, View } from 'react-native';

import type {
  EvaluationSummaryItem,
  HandwritingEvaluationResult,
} from '@/src/features/hiragana/domain/models/HandwritingEvaluation';
import { colors } from '@/src/shared/constants/colors';

type MemoryHandwritingEvaluationSummaryProps = {
  evaluation?: HandwritingEvaluationResult;
  errorMessage?: string;
  isLoading: boolean;
  language: 'en' | 'es';
};

const maxMajorItems = 3;

export function MemoryHandwritingEvaluationSummary({
  evaluation,
  errorMessage,
  isLoading,
  language,
}: MemoryHandwritingEvaluationSummaryProps) {
  const majorItems = evaluation?.summary.filter((item) => item.severity === 'major') ?? [];
  const visibleItems =
    majorItems.length > 0 ? majorItems.slice(0, maxMajorItems) : evaluation?.summary ?? [];
  const hiddenMajorCount =
    majorItems.length > 0 ? Math.max(0, majorItems.length - visibleItems.length) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'es' ? 'Evaluación de memoria' : 'Memory evaluation'}
      </Text>

      {evaluation ? (
        <Text style={styles.sourceLabel}>Evaluated by: {getSourceLabel(evaluation.source)}</Text>
      ) : null}

      {isLoading ? (
        <Text style={styles.message}>
          {language === 'es' ? 'Singra está revisando tus trazos...' : 'Singra is reviewing your strokes...'}
        </Text>
      ) : null}

      {!isLoading && errorMessage ? (
        <Text style={styles.message}>{errorMessage}</Text>
      ) : null}

      {!isLoading && !errorMessage && evaluation && evaluation.summary.length === 0 ? (
        <Text style={styles.positiveMessage}>
          {language === 'es'
            ? 'すごい! Singra no ve errores importantes en esta serie.'
            : 'すごい! Singra found no important issues in this series.'}
        </Text>
      ) : null}

      {!isLoading && !errorMessage && visibleItems.length > 0 ? (
        <View style={styles.summaryList}>
          {visibleItems.map((item) => (
            <SummaryRow key={item.id} item={item} />
          ))}
          {hiddenMajorCount > 0 ? (
            <Text style={styles.extraCount}>
              {language === 'es'
                ? `+${hiddenMajorCount} anotación major más`
                : `+${hiddenMajorCount} more major note`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!isLoading && !errorMessage && !evaluation ? (
        <Text style={styles.message}>
          {language === 'es'
            ? 'Evaluación disponible para series de 5, 10 o 20 kana.'
            : 'Evaluation is available for 5, 10, or 20 kana series.'}
        </Text>
      ) : null}
    </View>
  );
}

function getSourceLabel(source: HandwritingEvaluationResult['source']) {
  if (source === 'ai') {
    return 'AI';
  }

  if (source === 'mock') {
    return 'MOCK';
  }

  return 'FALLBACK';
}

function SummaryRow({ item }: { item: EvaluationSummaryItem }) {
  return (
    <View style={styles.summaryRow}>
      {item.kana ? <Text style={styles.kana}>{item.kana}</Text> : null}
      <Text style={styles.summaryText}>{item.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  sourceLabel: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
  },
  positiveMessage: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryList: {
    gap: 8,
  },
  summaryRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  kana: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    minWidth: 34,
    textAlign: 'center',
  },
  summaryText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  extraCount: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
