import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { KanaSeries } from '@/src/features/hiragana/domain/models/KanaSeries';
import type { MemoryPracticeVariant } from '@/src/features/hiragana/domain/models/MemoryPracticeVariant';
import { getMascotImage } from '@/src/shared/assets/imageRegistry';
import { AnimatedSingra } from '@/src/shared/components/AnimatedSingra';
import { KawaiiBackground } from '@/src/shared/components/KawaiiBackground';
import { colors } from '@/src/shared/constants/colors';
import { useTranslation } from '@/src/shared/i18n/useTranslation';
import { useResponsiveLayout } from '@/src/shared/responsive/breakpoints';

type MemoryPracticeVariantSelectionScreenProps = {
  series: KanaSeries;
  onBack: () => void;
  onSelectVariant: (variant: MemoryPracticeVariant) => void;
};

const maxContentWidth = 760;
const cardGap = 14;

export function MemoryPracticeVariantSelectionScreen({
  series,
  onBack,
  onSelectVariant,
}: MemoryPracticeVariantSelectionScreenProps) {
  const { language, t } = useTranslation();
  const { isMobile, width } = useResponsiveLayout();
  const screenPadding = isMobile ? 14 : 24;
  const contentWidth = Math.min(width - screenPadding * 2, maxContentWidth);
  const cardWidth = isMobile ? contentWidth : Math.floor((contentWidth - cardGap) / 2);
  const withoutAiImage = getMascotImage('singraWithoutAi');
  const withAiImage = getMascotImage('singraWithAi');

  return (
    <ScrollView contentContainerStyle={styles.screen} showsVerticalScrollIndicator={false}>
      <KawaiiBackground kana={['memory', series.representativeKana, 'AI']} />

      <View style={[styles.content, { width: contentWidth }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{`<- ${t.common.back}`}</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>
            {language === 'es' ? 'Elige tu práctica de memoria' : 'Choose memory practice'}
          </Text>
          <Text style={styles.subtitle}>
            {language === 'es'
              ? 'La elección se aplica solo a esta sesión.'
              : 'Your choice applies only to this session.'}
          </Text>
        </View>

        <View style={[styles.cards, isMobile ? styles.cardsMobile : null, { gap: cardGap }]}>
          <VariantCard
            accentColor="#F4E6A4"
            description={
              language === 'es'
                ? 'Practica como siempre y revisa tus respuestas al final.'
                : 'Practice as usual and review your answers at the end.'
            }
            imageSource={withoutAiImage}
            title={language === 'es' ? 'Practicar normal' : 'Practice normally'}
            width={cardWidth}
            onPress={() => onSelectVariant('without-ai')}
          />
          <VariantCard
            accentColor="#BFDCEF"
            description={
              language === 'es'
                ? 'Singra revisa tu escritura al terminar la serie.'
                : 'Singra reviews your handwriting after the series.'
            }
            imageSource={withAiImage}
            title={language === 'es' ? 'Practicar con IA' : 'Practice with AI'}
            width={cardWidth}
            onPress={() => onSelectVariant('with-ai')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

type VariantCardProps = {
  accentColor: string;
  description: string;
  imageSource?: ReturnType<typeof getMascotImage>;
  title: string;
  width: number;
  onPress: () => void;
};

function VariantCard({
  accentColor,
  description,
  imageSource,
  title,
  width,
  onPress,
}: VariantCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: accentColor, width },
        pressed ? styles.cardPressed : null,
      ]}>
      <View style={[styles.imageFrame, { backgroundColor: accentColor }]}>
        {imageSource ? (
          <AnimatedSingra mood="thinking" size={156} source={imageSource} />
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  content: {
    gap: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  cards: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cardsMobile: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  imageFrame: {
    alignItems: 'center',
    borderRadius: 16,
    height: 180,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  copy: {
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardDescription: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
});
