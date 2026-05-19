import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type {
  CreateVocabularyDraftInput,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type AddVocabularyFlowScreenProps = {
  searchInitialCandidates: (query: string) => Promise<DictionaryCandidate[]>;
  searchExternalCandidates: (
    query: string,
    existingCandidates: DictionaryCandidate[],
  ) => Promise<DictionaryCandidate[]>;
  tokenizeKana: (value: string) => string[];
  resolveKanaSeries: (kana: string) => Promise<string | undefined>;
  createDraft: (input: CreateVocabularyDraftInput) => Promise<VocabularyDraft>;
  onBack: () => void;
};

type FlowStep = 'word' | 'candidate' | 'kana' | 'writingSystem' | 'saved';

const writingSystemOptions: VocabularyWritingSystem[] = ['hiragana', 'katakana', 'kanji', 'mixed'];

export function AddVocabularyFlowScreen({
  searchExternalCandidates,
  searchInitialCandidates,
  tokenizeKana,
  resolveKanaSeries,
  createDraft,
  onBack,
}: AddVocabularyFlowScreenProps) {
  const { isMobile, width } = useResponsiveLayout();
  const contentWidth = Math.min(width - 28, isMobile ? 560 : 720);
  const [step, setStep] = useState<FlowStep>('word');
  const [word, setWord] = useState('');
  const [candidates, setCandidates] = useState<DictionaryCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<DictionaryCandidate | undefined>();
  const [mainKana, setMainKana] = useState('');
  const [kanaSeries, setKanaSeries] = useState<string | undefined>();
  const [writingSystem, setWritingSystem] = useState<VocabularyWritingSystem>('hiragana');
  const [savedDraft, setSavedDraft] = useState<VocabularyDraft | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [hasSearchedExternal, setHasSearchedExternal] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const kanaOptions = useMemo(() => {
    if (!selectedCandidate) {
      return [];
    }

    return tokenizeKana(selectedCandidate.readingKana || selectedCandidate.japanese);
  }, [selectedCandidate, tokenizeKana]);

  async function handleSearch() {
    setIsLoading(true);
    setMessage(undefined);

    try {
      const results = await searchInitialCandidates(word);
      setCandidates(results);
      setHasSearchedExternal(results.some((candidate) => candidate.origin === 'external'));
      setSelectedCandidate(results[0]);
      setWritingSystem(results[0]?.suggestedWritingSystem ?? 'hiragana');
      setMainKana(tokenizeKana(results[0]?.readingKana ?? results[0]?.japanese ?? '')[0] ?? '');
      setStep('candidate');
    } catch (error) {
      setMessage(`No se pudo consultar el diccionario ahora mismo. Detalle: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearchExternal() {
    setIsLoadingExternal(true);
    setMessage(undefined);

    try {
      const results = await searchExternalCandidates(word, candidates);
      setCandidates(results);
      setHasSearchedExternal(true);
      setSelectedCandidate((currentCandidate) => currentCandidate ?? results[0]);
    } catch (error) {
      setMessage(`No se pudo consultar Jisho ahora mismo. Detalle: ${getErrorMessage(error)}`);
    } finally {
      setIsLoadingExternal(false);
    }
  }

  async function handleConfirmCandidate() {
    if (!selectedCandidate) {
      return;
    }

    const firstKana = tokenizeKana(selectedCandidate.readingKana || selectedCandidate.japanese)[0];
    const nextMainKana = mainKana || firstKana || '';
    setMainKana(nextMainKana);
    await updateKanaSeries(nextMainKana);
    setStep('kana');
  }

  async function handleSelectKana(kana: string) {
    setMainKana(kana);
    await updateKanaSeries(kana);
  }

  async function updateKanaSeries(kana: string) {
    if (!kana) {
      setKanaSeries(undefined);
      return;
    }

    setKanaSeries(await resolveKanaSeries(kana));
  }

  async function handleSave() {
    if (!selectedCandidate || !mainKana) {
      return;
    }

    setIsLoading(true);
    setMessage(undefined);

    try {
      const draft = await createDraft({
        japanese: selectedCandidate.japanese,
        readingKana: selectedCandidate.readingKana,
        romaji: selectedCandidate.romaji,
        meaningEs: selectedCandidate.meaningEs,
        meaningEn: selectedCandidate.meaningEn,
        mainKana,
        kanaSeries,
        writingSystem,
      });
      setSavedDraft(draft);
      setStep('saved');
    } catch (error) {
      setMessage(`No se pudo guardar el borrador en Supabase. Detalle: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <KawaiiBackground kana={['言', '仮', '語']} />
      <View style={[styles.content, { width: contentWidth }]}>
        <View style={styles.topBar}>
          <AppButton label="Volver" onPress={onBack} size="compact" variant="secondary" />
          <Text style={styles.stepLabel}>{getStepLabel(step)}</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Agregar palabra</Text>
          <Text style={styles.subtitle}>
            Escribe una palabra en español, inglés o japonés. Ejemplo: gato, cat, ねこ.
          </Text>
        </View>

        <View style={styles.panel}>
          {step === 'word' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Palabra</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setWord}
                placeholder="Escribe una palabra en español, inglés o japonés"
                placeholderTextColor={colors.disabledText}
                style={styles.input}
                value={word}
              />
              <PrimaryAction
                disabled={!word.trim() || isLoading}
                label={isLoading ? 'Buscando...' : 'Consultar candidatos'}
                onPress={handleSearch}
              />
            </View>
          ) : null}

          {step === 'candidate' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Candidatos</Text>
              {candidates.length === 0 ? (
                <Text style={styles.bodyText}>No hay candidatos para esta palabra.</Text>
              ) : (
                candidates.map((candidate) => (
                  <CandidateCard
                    candidate={candidate}
                    key={candidate.id}
                    selected={selectedCandidate?.id === candidate.id}
                    onPress={() => {
                      setSelectedCandidate(candidate);
                      setWritingSystem(candidate.suggestedWritingSystem);
                      setMainKana(tokenizeKana(candidate.readingKana || candidate.japanese)[0] ?? '');
                    }}
                  />
                ))
              )}
              {!hasSearchedExternal ? (
                <PrimaryAction
                  disabled={isLoadingExternal}
                  label={isLoadingExternal ? 'Buscando en Jisho...' : 'Buscar más significados'}
                  onPress={handleSearchExternal}
                  variant="secondary"
                />
              ) : null}
              <FooterActions
                primaryDisabled={!selectedCandidate}
                primaryLabel="Elegir candidato"
                secondaryLabel="Cambiar palabra"
                onPrimary={handleConfirmCandidate}
                onSecondary={() => setStep('word')}
              />
            </View>
          ) : null}

          {step === 'kana' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kana principal</Text>
              <View style={styles.kanaGrid}>
                {kanaOptions.map((kana) => (
                  <Pressable
                    accessibilityRole="button"
                    key={kana}
                    onPress={() => handleSelectKana(kana)}
                    style={[styles.kanaOption, mainKana === kana ? styles.kanaOptionActive : null]}>
                    <Text
                      style={[
                        styles.kanaOptionText,
                        mainKana === kana ? styles.kanaOptionTextActive : null,
                      ]}>
                      {kana}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.helperText}>
                {kanaSeries ? `Serie detectada: ${kanaSeries}` : 'La serie se resolverá si el kana existe en catálogo.'}
              </Text>
              <FooterActions
                primaryDisabled={!mainKana}
                primaryLabel="Confirmar kana"
                secondaryLabel="Volver"
                onPrimary={() => setStep('writingSystem')}
                onSecondary={() => setStep('candidate')}
              />
            </View>
          ) : null}

          {step === 'writingSystem' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sistema de escritura</Text>
              <View style={styles.optionGrid}>
                {writingSystemOptions.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option}
                    onPress={() => setWritingSystem(option)}
                    style={[styles.optionPill, writingSystem === option ? styles.optionPillActive : null]}>
                    <Text
                      style={[
                        styles.optionPillText,
                        writingSystem === option ? styles.optionPillTextActive : null,
                      ]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Summary candidate={selectedCandidate} mainKana={mainKana} writingSystem={writingSystem} />
              <FooterActions
                primaryDisabled={isLoading}
                primaryLabel={isLoading ? 'Guardando...' : 'Guardar draft'}
                secondaryLabel="Volver"
                onPrimary={handleSave}
                onSecondary={() => setStep('kana')}
              />
            </View>
          ) : null}

          {step === 'saved' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Draft guardado</Text>
              <Text style={styles.savedKana}>{savedDraft?.japanese}</Text>
              <Text style={styles.bodyText}>La palabra quedó como borrador manual.</Text>
              <AppButton label="Volver al inicio" onPress={onBack} />
            </View>
          ) : null}

          {message ? <Text style={styles.errorText}>{message}</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}

function CandidateCard({
  candidate,
  selected,
  onPress,
}: {
  candidate: DictionaryCandidate;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.candidateCard, selected ? styles.candidateCardSelected : null]}>
      <Text style={styles.candidateJapanese}>{candidate.japanese}</Text>
      <View
        style={[
          styles.originBadge,
          candidate.origin === 'external' ? styles.externalBadge : styles.localBadge,
        ]}>
        <Text
          style={[
            styles.originBadgeText,
            candidate.origin === 'external' ? styles.externalBadgeText : styles.localBadgeText,
          ]}>
          {candidate.origin === 'external' ? 'Jisho' : 'Existente'}
        </Text>
      </View>
      <Text style={styles.bodyText}>
        {candidate.romaji[0] || candidate.readingKana}
        {candidate.meaningEs ? ` · ${candidate.meaningEs}` : ''}
      </Text>
      {!candidate.meaningEs && candidate.meaningEn ? (
        <Text style={styles.bodyText}>{candidate.meaningEn}</Text>
      ) : null}
    </Pressable>
  );
}

function FooterActions({
  primaryDisabled,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  primaryDisabled?: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <View style={styles.footerActions}>
      <AppButton label={secondaryLabel} onPress={onSecondary} variant="secondary" />
      <PrimaryAction disabled={primaryDisabled} label={primaryLabel} onPress={onPrimary} />
    </View>
  );
}

function PrimaryAction({
  disabled,
  label,
  onPress,
  variant = 'primary',
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryAction,
        variant === 'secondary' ? styles.secondaryAction : null,
        disabled ? styles.disabledAction : null,
      ]}>
      <Text
        style={[
          styles.primaryActionText,
          variant === 'secondary' ? styles.secondaryActionText : null,
          disabled ? styles.disabledActionText : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Summary({
  candidate,
  mainKana,
  writingSystem,
}: {
  candidate?: DictionaryCandidate;
  mainKana: string;
  writingSystem: VocabularyWritingSystem;
}) {
  if (!candidate) {
    return null;
  }

  return (
    <View style={styles.summary}>
      <Text style={styles.summaryText}>Palabra: {candidate.japanese}</Text>
      <Text style={styles.summaryText}>Kana principal: {mainKana}</Text>
      <Text style={styles.summaryText}>Writing system: {writingSystem}</Text>
    </View>
  );
}

function getStepLabel(step: FlowStep) {
  const stepLabels: Record<FlowStep, string> = {
    word: '1 de 5',
    candidate: '2 de 5',
    kana: '3 de 5',
    writingSystem: '4 de 5',
    saved: '5 de 5',
  };

  return stepLabels[step];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 14,
  },
  content: {
    gap: 16,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '900',
  },
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.panel,
    borderWidth: 1,
    padding: 18,
    ...softShadow,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    ...softShadow,
  },
  primaryActionText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryAction: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    shadowOpacity: 0.03,
  },
  secondaryActionText: {
    color: colors.text,
  },
  disabledAction: {
    backgroundColor: colors.disabledSurface,
  },
  disabledActionText: {
    color: colors.disabledText,
  },
  candidateCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  candidateCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  candidateJapanese: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  originBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  localBadge: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  externalBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  originBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  localBadgeText: {
    color: colors.success,
  },
  externalBadgeText: {
    color: colors.mutedText,
  },
  bodyText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  kanaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kanaOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  kanaOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kanaOptionText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  kanaOptionTextActive: {
    color: colors.onPrimary,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionPillText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  optionPillTextActive: {
    color: colors.onPrimary,
  },
  summary: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  summaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  savedKana: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 14,
  },
});
