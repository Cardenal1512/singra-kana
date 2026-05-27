import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { MemoryHandwritingCollage } from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import { colors } from '@/src/shared/constants/colors';

type MemoryHandwritingCollagePreviewProps = {
  availableWidth: number;
  collage?: MemoryHandwritingCollage;
  language: 'en' | 'es';
};

const maxPreviewWidth = 520;
const maxPreviewHeight = 260;
const debugCellSize = 82;

export function MemoryHandwritingCollagePreview({
  availableWidth,
  collage,
  language,
}: MemoryHandwritingCollagePreviewProps) {
  if (!collage) {
    return null;
  }

  const width = Math.min(availableWidth, maxPreviewWidth);
  const height = Math.max(
    44,
    Math.min(maxPreviewHeight, width * (collage.height / Math.max(collage.width, 1))),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'es' ? 'Preview temporal del collage' : 'Temporary collage preview'}
      </Text>
      <View style={[styles.previewFrame, { height, width }]}>
        <SvgXml xml={collage.svgXml} width={width} height={height} />
      </View>
      <Text style={styles.meta}>
        {collage.layout.rows}x{collage.layout.columns} - {collage.width}x{collage.height} - stroke {collage.strokeWidth}px
      </Text>
      <View style={styles.debugGrid}>
        {collage.debugCells.map((cell, index) => (
          <View key={`${cell.expectedKana}-${index}`} style={styles.debugCell}>
            <SvgXml xml={cell.svgXml} width={debugCellSize} height={debugCellSize} />
            <Text style={styles.debugMeta}>
              {cell.expectedKana} bbox {Math.round(cell.bounds.width)}x{Math.round(cell.bounds.height)}
            </Text>
            <Text style={styles.debugMeta}>
              render {Math.round(cell.render.width)}x{Math.round(cell.render.height)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  debugCell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: 5,
    width: 110,
  },
  debugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  debugMeta: {
    color: colors.mutedText,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
    textAlign: 'center',
  },
  meta: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewFrame: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
