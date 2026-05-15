import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

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
};

export function KanaPracticeHeader({
  kana,
  romaji,
  example,
  language,
  mascotImage,
  exampleImage,
}: KanaPracticeHeaderProps) {
  const { t } = useTranslation();
  const meaning = example && language === 'es' ? example.meaningEs : example?.meaningEn;
  const hasVisual = Boolean(mascotImage || exampleImage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.writing.title}</Text>

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
              <Text style={styles.exampleMeta}>
                {example.romaji} · {meaning}
              </Text>
            </View>
          ) : null}
        </View>

        {hasVisual ? (
          <View style={styles.visualColumn}>
            {mascotImage ? <Image source={mascotImage} style={styles.mascotImage} /> : null}
            {exampleImage ? <Image source={exampleImage} style={styles.exampleImage} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
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
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    gap: 8,
    justifyContent: 'center',
  },
  mascotImage: {
    height: 54,
    resizeMode: 'contain',
    width: 54,
  },
  exampleImage: {
    borderRadius: 12,
    height: 76,
    resizeMode: 'cover',
    width: 76,
  },
});
