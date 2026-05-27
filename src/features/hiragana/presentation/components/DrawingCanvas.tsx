import { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import { buildStrokeSvgPath } from '@/src/features/hiragana/domain/services/buildStrokeSvgPath';
import { colors } from '@/src/shared/constants/colors';

export type CanvasSize = {
  width: number;
  height: number;
};

type DrawingCanvasProps = {
  guideCharacter: string;
  disabled?: boolean;
  maxSize?: number;
  showGuide: boolean;
  strokes: StrokePoint[][];
  onChangeCanvasSize?: (canvasSize: CanvasSize) => void;
  onChangeStrokes: (strokes: StrokePoint[][]) => void;
};

const strokeWidth = 16;
const inkWashStrokeWidth = 22;

export function DrawingCanvas({
  guideCharacter,
  disabled = false,
  maxSize,
  showGuide,
  strokes,
  onChangeCanvasSize,
  onChangeStrokes,
}: DrawingCanvasProps) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [activeStroke, setActiveStroke] = useState<StrokePoint[]>([]);
  const activeStrokeRef = useRef<StrokePoint[]>([]);
  const canvasSizeRef = useRef(canvasSize);
  const disabledRef = useRef(disabled);
  const strokesRef = useRef(strokes);
  const onChangeCanvasSizeRef = useRef(onChangeCanvasSize);
  const onChangeStrokesRef = useRef(onChangeStrokes);

  canvasSizeRef.current = canvasSize;
  disabledRef.current = disabled;
  strokesRef.current = strokes;
  onChangeCanvasSizeRef.current = onChangeCanvasSize;
  onChangeStrokesRef.current = onChangeStrokes;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        if (disabledRef.current) {
          return;
        }

        stopNativeEvent(event);

        const point = getCanvasLocalPoint(event, canvasSizeRef.current);
        activeStrokeRef.current = [point];
        setActiveStroke(activeStrokeRef.current);
      },
      onPanResponderMove: (event) => {
        if (disabledRef.current) {
          return;
        }

        stopNativeEvent(event);

        const point = getCanvasLocalPoint(event, canvasSizeRef.current);
        activeStrokeRef.current = [...activeStrokeRef.current, point];
        setActiveStroke(activeStrokeRef.current);
      },
      onPanResponderRelease: (event) => {
        if (disabledRef.current) {
          return;
        }

        stopNativeEvent(event);
        commitActiveStroke();
      },
      onPanResponderTerminate: (event) => {
        if (disabledRef.current) {
          return;
        }

        stopNativeEvent(event);
        commitActiveStroke();
      },
    }),
  ).current;

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    const nextCanvasSize = { width, height };
    setCanvasSize(nextCanvasSize);
    onChangeCanvasSizeRef.current?.(nextCanvasSize);
  }

  function commitActiveStroke() {
    if (activeStrokeRef.current.length > 0) {
      onChangeStrokesRef.current([...strokesRef.current, activeStrokeRef.current]);
    }

    activeStrokeRef.current = [];
    setActiveStroke([]);
  }

  return (
    <View
      style={[styles.canvasFrame, maxSize ? { maxWidth: maxSize } : null]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}>
      <View pointerEvents="none" style={styles.paperLayer}>
        <View style={styles.verticalGuideLine} />
        <View style={styles.horizontalGuideLine} />
      </View>

      {showGuide ? (
        <View pointerEvents="none" style={styles.guideLayer}>
          <Text selectable={false} style={[styles.guide, webTextStyle]}>
            {guideCharacter}
          </Text>
        </View>
      ) : null}

      <Svg
        pointerEvents="none"
        style={styles.strokeLayer}
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}>
        {strokes.map((stroke, strokeIndex) => (
          <StrokePath key={`stroke-${strokeIndex}`} stroke={stroke} />
        ))}
        <StrokePath stroke={activeStroke} />
      </Svg>
    </View>
  );
}

function StrokePath({ stroke }: { stroke: StrokePoint[] }) {
  const path = buildPath(stroke);

  if (!path) {
    return null;
  }

  return (
    <>
      <Path
        d={path}
        stroke="rgba(23, 20, 18, 0.13)"
        strokeWidth={inkWashStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d={path}
        stroke={colors.ink}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d={path}
        stroke="rgba(255, 253, 247, 0.14)"
        strokeWidth={Math.max(2, strokeWidth * 0.28)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  );
}

export function buildPath(points: StrokePoint[]): string {
  return buildStrokeSvgPath(points, strokeWidth);
}

function getCanvasLocalPoint(
  event: GestureResponderEvent,
  canvasSize: CanvasSize,
): StrokePoint {
  const { locationX, locationY } = event.nativeEvent;

  return {
    x: clampToRange(locationX, 0, canvasSize.width),
    y: clampToRange(locationY, 0, canvasSize.height),
  };
}

function stopNativeEvent(event: GestureResponderEvent) {
  if (Platform.OS !== 'web') {
    return;
  }

  const webEvent = event.nativeEvent as GestureResponderEvent['nativeEvent'] & {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  };

  webEvent.preventDefault?.();
  webEvent.stopPropagation?.();
}

function clampToRange(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type WebCanvasStyle = ViewStyle & {
  cursor?: 'crosshair';
  touchAction?: 'none';
  userSelect?: 'none';
};

const webCanvasStyle = Platform.select<ViewStyle>({
  web: {
    cursor: 'crosshair',
    touchAction: 'none',
    userSelect: 'none',
  } as unknown as WebCanvasStyle,
});

const webTextStyle = Platform.select<TextStyle>({
  web: {
    userSelect: 'none',
  },
});

const styles = StyleSheet.create({
  canvasFrame: {
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 460,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 2,
    ...webCanvasStyle,
  },
  paperLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  verticalGuideLine: {
    backgroundColor: colors.border,
    bottom: 0,
    left: '50%',
    opacity: 0.72,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  horizontalGuideLine: {
    backgroundColor: colors.border,
    height: 1,
    left: 0,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  guideLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  guide: {
    color: colors.guide,
    fontSize: 220,
    fontWeight: '700',
    lineHeight: 260,
  },
});
