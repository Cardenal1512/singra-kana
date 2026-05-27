import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { SelectableCard } from '@/src/shared/components/SelectableCard';
import { colors } from '@/src/shared/constants/colors';
import { pastelColors, radii, softShadow } from '@/src/shared/constants/visualSystem';
import type { Language } from '@/src/shared/i18n/translations';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { FloatingView } from '@/src/shared/motion/FloatingView';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type HomeScreenProps = {
  onOpenHiragana: () => void;
  onOpenAddVocabulary: () => void;
};

export function HomeScreen({
  onOpenAddVocabulary,
  onOpenHiragana,
}: HomeScreenProps) {
  const { height, isDesktop, isMobile, isTablet, width } = useResponsiveLayout();
  const { language, setLanguage, t } = useTranslation();
  const singraHomeImage = getMascotImage('singraHome');
  const screenPadding = isMobile ? 16 : 32;
  const contentWidth = Math.min(Math.max(width - screenPadding * 2, 0), isDesktop ? 980 : 760);
  const cardWidth = isMobile ? contentWidth : Math.floor((contentWidth - 24) / 3);
  const titleSize = isDesktop ? 50 : isTablet ? 44 : Math.min(38, Math.max(31, width * 0.09));
  const mascotSize = getMascotSize(width, height, isDesktop, isTablet);

  return (
    <View style={styles.root}>
      <KawaiiBackground kana={['仮', 'あ', '字']} />
      <View style={styles.languageSelectorPosition}>
        <LanguageSelector
          activeLanguage={language}
          englishLabel={t.language.english}
          label={t.language.label}
          spanishLabel={t.language.spanish}
          onChangeLanguage={setLanguage}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: isMobile ? 18 : 32,
            paddingHorizontal: screenPadding,
            paddingTop: isMobile ? 58 : 32,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.motionFrame, { width: contentWidth }]}>
          <View
            style={[
              styles.hero,
              isMobile ? styles.heroStacked : styles.heroWide,
              { width: contentWidth },
            ]}>
            <View style={styles.header}>
              {!singraHomeImage && (
                <View style={styles.heroMark}>
                  <View style={styles.heroHalo}>
                    <Text style={styles.heroKana}>仮</Text>
                  </View>
                </View>
              )}
              <Text style={[styles.title, { fontSize: titleSize }]}>{t.home.title}</Text>
              <Text style={[styles.subtitle, isMobile ? styles.subtitleMobile : null]}>
                {t.home.subtitle}
              </Text>
            </View>

            {singraHomeImage ? (
              <FloatingView>
                <View
                  style={[
                    styles.mascotShell,
                    { height: mascotSize + 34, width: mascotSize + 34 },
                  ]}>
                  <View
                    style={[
                      styles.mascotHalo,
                      { height: mascotSize + 18, width: mascotSize + 18 },
                    ]}>
                    <AnimatedSingra mood="idle" size={mascotSize} source={singraHomeImage} />
                  </View>
                </View>
              </FloatingView>
            ) : null}
          </View>

          <View
            style={[
              styles.cardList,
              isMobile ? styles.cardListMobile : styles.cardListWide,
              { width: contentWidth },
            ]}>
            <SelectableCard
              index={0}
              title="Hiragana"
              subtitle={t.home.hiraganaSubtitle}
              width={cardWidth}
              onPress={onOpenHiragana}
            />
            <SelectableCard
              title="Katakana"
              subtitle={t.home.katakanaSubtitle}
              disabled
              index={1}
              width={cardWidth}
            />
            <SelectableCard
              title="Kanji"
              subtitle={t.home.kanjiSubtitle}
              disabled
              index={2}
              width={cardWidth}
            />
            <SelectableCard
              title="Agregar palabra"
              subtitle="Crea un borrador de vocabulario"
              index={3}
              width={cardWidth}
              onPress={onOpenAddVocabulary}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

type LanguageSelectorProps = {
  activeLanguage: Language;
  englishLabel: string;
  label: string;
  spanishLabel: string;
  onChangeLanguage: (language: Language) => void;
};

function LanguageSelector({
  activeLanguage,
  englishLabel,
  label,
  spanishLabel,
  onChangeLanguage,
}: LanguageSelectorProps) {
  return (
    <View accessibilityLabel={label} style={styles.languageSelector}>
      <LanguageOption
        active={activeLanguage === 'es'}
        label={spanishLabel}
        shortLabel="ES"
        onPress={() => onChangeLanguage('es')}
      />
      <LanguageOption
        active={activeLanguage === 'en'}
        label={englishLabel}
        shortLabel="EN"
        onPress={() => onChangeLanguage('en')}
      />
    </View>
  );
}

type LanguageOptionProps = {
  active: boolean;
  label: string;
  shortLabel: string;
  onPress: () => void;
};

function LanguageOption({ active, label, shortLabel, onPress }: LanguageOptionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.languageOption, active ? styles.languageOptionActive : null]}>
      <Text style={[styles.languageOptionText, active ? styles.languageOptionTextActive : null]}>
        {shortLabel}
      </Text>
    </Pressable>
  );
}

function getMascotSize(width: number, height: number, isDesktop: boolean, isTablet: boolean) {
  if (isDesktop) {
    return 282;
  }

  if (isTablet) {
    return 228;
  }

  const compactHeightSize = height < 700 ? 118 : 148;
  return Math.min(compactHeightSize, Math.max(112, width * 0.34));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100%',
    overflow: 'visible',
  },
  languageSelectorPosition: {
    position: 'absolute',
    right: 14,
    top: 12,
    zIndex: 3,
  },
  languageSelector: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    ...softShadow,
  },
  languageOption: {
    alignItems: 'center',
    borderRadius: radii.pill,
    minWidth: 38,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
  },
  languageOptionText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  languageOptionTextActive: {
    color: colors.onPrimary,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  motionFrame: {
    alignItems: 'center',
    gap: 24,
    maxWidth: 980,
  },
  hero: {
    alignItems: 'center',
    maxWidth: 980,
  },
  heroWide: {
    flexDirection: 'row',
    gap: 42,
    justifyContent: 'center',
  },
  heroStacked: {
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  heroMark: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.orange,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    width: 86,
    ...softShadow,
  },
  heroKana: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 52,
  },
  mascotShell: {
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'center',
  },
  mascotHalo: {
    alignItems: 'center',
    backgroundColor: pastelColors.yellow,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    ...softShadow,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
    textAlign: 'center',
  },
  subtitleMobile: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardList: {
    alignSelf: 'center',
    gap: 12,
  },
  cardListMobile: {
    flexDirection: 'column',
    maxWidth: 560,
  },
  cardListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 980,
  },
});
