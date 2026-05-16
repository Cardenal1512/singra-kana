import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';

import type { KanaExample } from '@/src/features/hiragana/domain/models/KanaExample';
import { colors } from '@/src/shared/constants/colors';
import type { Language } from '@/src/shared/i18n/translations';
import { useTranslation } from '@/src/shared/i18n/useTranslation';

type KanaPracticeHeaderProps = {
  kana: string;
  romaji: string;
  example?: KanaExample;
  language: Language;
  mascotImage?: ImageSourcePropType;
  exampleImage?: ImageSourcePropType;
  showKanaInfo?: boolean;
};

export function KanaPracticeHeader({
  kana,
  romaji,
  example,
  language,
  mascotImage,
  exampleImage,
  showKanaInfo = true,
}: KanaPracticeHeaderProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const meaning = example && language === 'es' ? example.meaningEs : example?.meaningEn;
  const hasVisual = Boolean(mascotImage || exampleImage);
  const exampleImageSize = getExampleImageSize(width);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.writing.title}</Text>

      {showKanaInfo ? (
      <View style={styles.infoCard}>
        <View style={styles.copy}>
          <View style={styles.kanaBlock}>
            <Text style={styles.intro}>
              {formatTranslation(t.writing.kanaIntro, { kana })}
            </Text>
            <Text style={styles.pronunciation}>
              {formatTranslation(t.writing.pronunciation, {
                romaji: romaji.toUpperCase(),
              })}
            </Text>
          </View>

          {example ? (
            <View style={styles.exampleBlock}>
              <Text style={styles.exampleIntro}>{t.writing.exampleIntro}</Text>
              <Text style={styles.exampleWord}>{example.word}</Text>
              <Text style={styles.exampleMeta}>{`${example.romaji} · ${meaning}`}</Text>
            </View>
          ) : null}
        </View>

        {hasVisual ? (
          <View style={styles.visualColumn}>
            {mascotImage ? <Image source={mascotImage} style={styles.mascotImage} /> : null}
            {exampleImage ? (
              <View
                style={[
                  styles.exampleImageContainer,
                  { height: exampleImageSize, width: exampleImageSize },
                ]}>
                <Image
                  source={exampleImage}
                  style={styles.exampleImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      ) : (
        <View style={styles.memoryPromptCard}>
          <Text style={styles.memoryPromptLabel}>{t.writing.memoryInstruction}</Text>
          <Text style={styles.memoryPromptRomaji}>{romaji.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

function getExampleImageSize(width: number) {
  if (width >= 768) {
    return 130;
  }

  return 90;
}

function formatTranslation(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{{${key}}}`, value),
    template,
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  infoCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  memoryPromptCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 150,
  },
  memoryPromptLabel: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  memoryPromptRomaji: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  kanaBlock: {
    gap: 2,
  },
  intro: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  pronunciation: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  exampleBlock: {
    gap: 1,
  },
  exampleIntro: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  exampleWord: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 29,
  },
  exampleMeta: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  visualColumn: {
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
    justifyContent: 'center',
  },
  mascotImage: {
    height: 54,
    resizeMode: 'contain',
    width: 54,
  },
  exampleImageContainer: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
  exampleImage: {
    height: '100%',
    width: '100%',
  },
});
