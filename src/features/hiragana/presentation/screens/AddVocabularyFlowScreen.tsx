import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type {
  CreateVocabularyDraftInput,
  ManualVocabularyImage,
  VocabularyDraft,
} from '@/src/features/hiragana/domain/models/VocabularyDraft';
import type { VocabularyWritingSystem } from '@/src/features/hiragana/domain/models/WritingSystem';
import { playSound } from '@/src/shared/audio/AudioService';
import { AppButton } from '@/src/shared/components/AppButton';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { radii, softShadow } from '@/src/shared/constants/visualSystem';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type AddVocabularyFlowScreenProps = {
  createDraft: (input: CreateVocabularyDraftInput) => Promise<VocabularyDraft>;
  resolveKanaSeries: (kana: string) => Promise<string | undefined>;
  searchExternalCandidates: (
    query: string,
    existingCandidates: DictionaryCandidate[],
  ) => Promise<DictionaryCandidate[]>;
  searchInitialCandidates: (query: string) => Promise<DictionaryCandidate[]>;
  showBackButton?: boolean;
  tokenizeKana: (value: string) => string[];
  onBack: () => void;
};

type FlowStep = 'word' | 'candidate' | 'kana' | 'writingSystem' | 'saved';

const writingSystemOptions: VocabularyWritingSystem[] = ['hiragana', 'katakana', 'kanji', 'mixed'];

export function AddVocabularyFlowScreen({
  createDraft,
  resolveKanaSeries,
  searchExternalCandidates,
  searchInitialCandidates,
  showBackButton = true,
  tokenizeKana,
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
  const [category, setCategory] = useState('');
  const [manualImage, setManualImage] = useState<ManualVocabularyImage | undefined>();
  const [manualImageError, setManualImageError] = useState<string | undefined>();
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
      const firstCandidate = results[0];
      setCandidates(results);
      setHasSearchedExternal(results.some((candidate) => candidate.origin === 'external'));
      setSelectedCandidate(firstCandidate);
      setWritingSystem(firstCandidate?.suggestedWritingSystem ?? 'hiragana');
      setMainKana(tokenizeKana(firstCandidate?.readingKana ?? firstCandidate?.japanese ?? '')[0] ?? '');
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
    setKanaSeries(kana ? await resolveKanaSeries(kana) : undefined);
  }

  async function handlePickManualImage() {
    setManualImageError(undefined);
    setMessage(undefined);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setManualImageError('Necesito permiso para acceder a la galería y seleccionar la imagen WEBP.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      const nextImage: ManualVocabularyImage = {
        fileName: asset.fileName ?? getFileNameFromUri(asset.uri),
        height: asset.height,
        mimeType: asset.mimeType ?? '',
        uri: asset.uri,
        width: asset.width,
      };
      const error = validateManualImage(nextImage);

      setManualImage(nextImage);
      setManualImageError(error);
    } catch (error) {
      setManualImageError(`No se pudo abrir la galería. Detalle: ${getErrorMessage(error)}`);
    }
  }

  async function handleSave() {
    if (!selectedCandidate || !mainKana) {
      return;
    }

    const imageValidationError = validateManualImage(manualImage);
    if (imageValidationError || !manualImage) {
      setManualImageError(imageValidationError);
      setMessage('Corrige la imagen antes de guardar. No se enviaron datos a Supabase.');
      return;
    }

    setIsLoading(true);
    setMessage(undefined);

    try {
      const draft = await createDraft({
        category,
        japanese: selectedCandidate.japanese,
        kanaSeries,
        mainKana,
        manualImage,
        meaningEn: selectedCandidate.meaningEn,
        meaningEs: selectedCandidate.meaningEs,
        readingKana: selectedCandidate.readingKana,
        romaji: selectedCandidate.romaji,
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
          {showBackButton ? (
            <AppButton label="Volver" onPress={onBack} size="compact" variant="secondary" />
          ) : (
            <View />
          )}
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
                    onPress={() => {
                      playSound('tap');
                      handleSelectKana(kana);
                    }}
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
                    onPress={() => {
                      playSound('tap');
                      setWritingSystem(option);
                    }}
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
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setCategory}
                placeholder="Categoría, por ejemplo comida, objetos, salud"
                placeholderTextColor={colors.disabledText}
                style={styles.input}
                value={category}
              />
              <ManualImagePicker
                error={manualImageError}
                image={manualImage}
                onPickImage={handlePickManualImage}
              />
              <Summary
                candidate={selectedCandidate}
                category={category}
                image={manualImage}
                mainKana={mainKana}
                writingSystem={writingSystem}
              />
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
              <Text style={styles.bodyText}>
                La palabra quedó como borrador manual con imagen validada.
              </Text>
              {savedDraft?.approvedImagePath ? (
                <Text style={styles.bodyText}>Imagen subida: {savedDraft.approvedImagePath}</Text>
              ) : null}
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
  const handlePress = () => {
    playSound('tap');
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
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

function ManualImagePicker({
  error,
  image,
  onPickImage,
}: {
  error?: string;
  image?: ManualVocabularyImage;
  onPickImage: () => void;
}) {
  return (
    <View style={styles.manualImagePanel}>
      <View style={styles.manualImageHeader}>
        <Text style={styles.promptTitle}>Imagen manual</Text>
        <PrimaryAction label={image ? 'Cambiar imagen' : 'Adjuntar WEBP'} onPress={onPickImage} />
      </View>
      <Text style={styles.helperText}>Requisitos: WEBP exacto de 512x512 px.</Text>
      {image ? (
        <View style={styles.manualImagePreviewRow}>
          <Image resizeMode="contain" source={{ uri: image.uri }} style={styles.manualImagePreview} />
          <View style={styles.manualImageMeta}>
            <Text style={styles.summaryText}>{image.fileName}</Text>
            <Text style={styles.helperText}>{image.width}x{image.height}px</Text>
            <Text style={styles.helperText}>{image.mimeType || 'tipo no informado'}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.bodyText}>Aún no hay imagen adjunta.</Text>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
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
  const handlePress = () => {
    playSound('tap');
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
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
  category,
  image,
  mainKana,
  writingSystem,
}: {
  candidate?: DictionaryCandidate;
  category: string;
  image?: ManualVocabularyImage;
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
      <Text style={styles.summaryText}>Categoría: {category.trim() || 'Sin categoría'}</Text>
      <Text style={styles.summaryText}>Imagen: {image ? image.fileName : 'Pendiente'}</Text>
    </View>
  );
}

function validateManualImage(image?: ManualVocabularyImage) {
  if (!image) {
    return 'Adjunta una imagen WEBP de 512x512 px antes de guardar.';
  }

  const isWebp =
    image.mimeType.toLowerCase() === 'image/webp' ||
    image.fileName.toLowerCase().endsWith('.webp') ||
    image.uri.toLowerCase().endsWith('.webp');

  if (!isWebp) {
    return 'La imagen debe estar en formato WEBP.';
  }

  if (image.width !== 512 || image.height !== 512) {
    return `La imagen debe medir exactamente 512x512 px. La seleccionada mide ${image.width}x${image.height}px.`;
  }

  return undefined;
}

function getFileNameFromUri(uri: string) {
  return uri.split('/').filter(Boolean).pop() ?? 'vocabulary.webp';
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

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      message?: unknown;
    };
    const parts = [
      maybeError.message ? `message: ${String(maybeError.message)}` : undefined,
      maybeError.code ? `code: ${String(maybeError.code)}` : undefined,
      maybeError.details ? `details: ${String(maybeError.details)}` : undefined,
      maybeError.hint ? `hint: ${String(maybeError.hint)}` : undefined,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : JSON.stringify(error);
  }

  return String(error);
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.mutedText,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
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
  content: {
    gap: 16,
  },
  disabledAction: {
    backgroundColor: colors.disabledSurface,
  },
  disabledActionText: {
    color: colors.disabledText,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  externalBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  externalBadgeText: {
    color: colors.mutedText,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  header: {
    gap: 6,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  localBadge: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  localBadgeText: {
    color: colors.success,
  },
  manualImageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  manualImageMeta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  manualImagePanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  manualImagePreview: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    height: 112,
    width: 112,
  },
  manualImagePreviewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
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
  originBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  originBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.panel,
    borderWidth: 1,
    padding: 18,
    ...softShadow,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 11,
    ...softShadow,
  },
  primaryActionText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  promptTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  savedKana: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  screen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 14,
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
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  stepLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
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
  title: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
