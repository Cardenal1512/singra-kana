import type {
  MemoryHandwritingCollage,
  MemoryHandwritingCollageDebugCell,
  MemoryHandwritingCollageLayout,
} from '@/src/features/hiragana/domain/models/MemoryHandwritingCollage';
import type { MemoryHandwritingDrawing } from '@/src/features/hiragana/domain/models/MemoryHandwritingDrawing';
import type { StrokePoint } from '@/src/features/hiragana/domain/models/StrokePoint';
import type { MemoryHandwritingCollageService } from '@/src/features/hiragana/domain/services/MemoryHandwritingCollageService';
import { buildStrokeSvgPath } from '@/src/features/hiragana/domain/services/buildStrokeSvgPath';

const columns = 5;
const cellSize = 224;
const cellPadding = 34;
const cellSpacing = 20;
const outerPadding = 28;
const outputStrokeWidth = 12;
const backgroundColor = 255;
const inkColor = 0;
const debugBorderColor = '#D8C7BB';
const debugBoundsColor = '#E04444';

type DrawingBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type RenderPlan = {
  bounds: DrawingBounds;
  cellX: number;
  cellY: number;
  debugSvgXml: string;
  drawing: MemoryHandwritingDrawing;
  renderHeight: number;
  renderWidth: number;
  renderX: number;
  renderY: number;
  scale: number;
};

export class SvgMemoryHandwritingCollageService implements MemoryHandwritingCollageService {
  async generate(drawings: MemoryHandwritingDrawing[]): Promise<MemoryHandwritingCollage | undefined> {
    const orderedDrawings = drawings
      .filter(isMemoryDrawing)
      .sort((first, second) => first.order - second.order);
    const layout = getLayout(orderedDrawings.length);

    if (!layout) {
      return undefined;
    }

    const width = outerPadding * 2 + layout.columns * cellSize + (layout.columns - 1) * cellSpacing;
    const height = outerPadding * 2 + layout.rows * cellSize + (layout.rows - 1) * cellSpacing;
    const image = new Uint8Array(width * height);
    image.fill(backgroundColor);

    const renderPlans = orderedDrawings.map((drawing, index) =>
      buildRenderPlan(drawing, index, layout),
    );

    renderPlans.forEach((plan) => {
      drawCellBackground(image, width, plan.cellX, plan.cellY);
      drawDrawing(image, width, height, plan);
    });

    const pngBytes = encodeGrayscalePng(width, height, image);
    const imageBase64 = encodeBase64(pngBytes);
    const svgXml = buildDebugCollageSvg(width, height, renderPlans);
    const debugCells = renderPlans.map<MemoryHandwritingCollageDebugCell>((plan) => ({
      bounds: plan.bounds,
      expectedKana: plan.drawing.expectedKana,
      height: cellSize,
      render: {
        height: plan.renderHeight,
        scale: plan.scale,
        strokeWidth: outputStrokeWidth,
        width: plan.renderWidth,
        x: plan.renderX - plan.cellX,
        y: plan.renderY - plan.cellY,
      },
      svgXml: plan.debugSvgXml,
      width: cellSize,
    }));

    console.log('[MemoryHandwritingCollage] Generated PNG collage', {
      debugCells: debugCells.map((cell) => ({
        bounds: cell.bounds,
        expectedKana: cell.expectedKana,
        render: cell.render,
      })),
      height,
      kanaCount: orderedDrawings.length,
      mimeType: 'image/png',
      strokeWidth: outputStrokeWidth,
      width,
    });

    return {
      debugCells,
      height,
      imageBase64,
      layout,
      localUri: `data:image/png;base64,${imageBase64}`,
      mimeType: 'image/png',
      strokeWidth: outputStrokeWidth,
      svgXml,
      width,
    };
  }
}

function getLayout(count: number): MemoryHandwritingCollageLayout | undefined {
  if (count === 5) {
    return { columns, rows: 1 };
  }

  if (count === 10) {
    return { columns, rows: 2 };
  }

  if (count === 20) {
    return { columns, rows: 4 };
  }

  return undefined;
}

function buildRenderPlan(
  drawing: MemoryHandwritingDrawing,
  index: number,
  layout: MemoryHandwritingCollageLayout,
): RenderPlan {
  const row = Math.floor(index / layout.columns);
  const column = index % layout.columns;
  const cellX = outerPadding + column * (cellSize + cellSpacing);
  const cellY = outerPadding + row * (cellSize + cellSpacing);
  const bounds = getDrawingBounds(drawing);
  const drawableSize = cellSize - cellPadding * 2;
  const scale = Math.min(drawableSize / bounds.width, drawableSize / bounds.height);
  const renderWidth = bounds.width * scale;
  const renderHeight = bounds.height * scale;
  const renderX = cellX + cellPadding + (drawableSize - renderWidth) / 2;
  const renderY = cellY + cellPadding + (drawableSize - renderHeight) / 2;
  const debugSvgXml = buildDebugCellSvg(drawing, bounds, {
    renderHeight,
    renderWidth,
    renderX: renderX - cellX,
    renderY: renderY - cellY,
    scale,
  });

  return {
    bounds,
    cellX,
    cellY,
    debugSvgXml,
    drawing,
    renderHeight,
    renderWidth,
    renderX,
    renderY,
    scale,
  };
}

function getDrawingBounds(drawing: MemoryHandwritingDrawing): DrawingBounds {
  const points = drawing.strokes.flat().filter(isFinitePoint);

  if (points.length === 0) {
    const width = Math.max(drawing.canvasSize.width, 1);
    const height = Math.max(drawing.canvasSize.height, 1);
    return {
      height,
      width,
      x: 0,
      y: 0,
    };
  }

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const minSize = 8;

  return {
    height: Math.max(maxY - minY, minSize),
    width: Math.max(maxX - minX, minSize),
    x: minX,
    y: minY,
  };
}

function drawCellBackground(image: Uint8Array, imageWidth: number, cellX: number, cellY: number) {
  for (let y = Math.floor(cellY); y < cellY + cellSize; y += 1) {
    const rowOffset = y * imageWidth;

    for (let x = Math.floor(cellX); x < cellX + cellSize; x += 1) {
      image[rowOffset + x] = backgroundColor;
    }
  }
}

function drawDrawing(
  image: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  plan: RenderPlan,
) {
  const transformedStrokes = plan.drawing.strokes.map((stroke) =>
    stroke.filter(isFinitePoint).map((point) => transformPoint(point, plan)),
  );

  transformedStrokes.forEach((stroke) => {
    if (stroke.length === 1) {
      drawBrush(image, imageWidth, imageHeight, stroke[0], outputStrokeWidth / 2);
      return;
    }

    for (let index = 1; index < stroke.length; index += 1) {
      drawLine(image, imageWidth, imageHeight, stroke[index - 1], stroke[index], outputStrokeWidth);
    }
  });
}

function transformPoint(point: StrokePoint, plan: RenderPlan): StrokePoint {
  return {
    x: plan.renderX + (point.x - plan.bounds.x) * plan.scale,
    y: plan.renderY + (point.y - plan.bounds.y) * plan.scale,
  };
}

function drawLine(
  image: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  start: StrokePoint,
  end: StrokePoint,
  strokeWidth: number,
) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const radius = strokeWidth / 2;
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.45)));

  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    drawBrush(
      image,
      imageWidth,
      imageHeight,
      {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      },
      radius,
    );
  }
}

function drawBrush(
  image: Uint8Array,
  imageWidth: number,
  imageHeight: number,
  center: StrokePoint,
  radius: number,
) {
  const minX = Math.max(0, Math.floor(center.x - radius - 1));
  const maxX = Math.min(imageWidth - 1, Math.ceil(center.x + radius + 1));
  const minY = Math.max(0, Math.floor(center.y - radius - 1));
  const maxY = Math.min(imageHeight - 1, Math.ceil(center.y + radius + 1));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y);

      if (distance > radius + 1) {
        continue;
      }

      const edgeAlpha = Math.max(0, Math.min(1, radius + 1 - distance));
      const pixelIndex = y * imageWidth + x;
      const nextValue = Math.round(backgroundColor * (1 - edgeAlpha) + inkColor * edgeAlpha);
      image[pixelIndex] = Math.min(image[pixelIndex], nextValue);
    }
  }
}

function buildDebugCollageSvg(width: number, height: number, plans: RenderPlan[]) {
  const cells = plans.map((plan) => {
    const paths = buildDebugPaths(plan.drawing, plan.bounds, plan.scale, plan.renderX, plan.renderY);

    return [
      `<rect x="${formatNumber(plan.cellX)}" y="${formatNumber(plan.cellY)}" width="${cellSize}" height="${cellSize}" fill="#FFFFFF" stroke="${debugBorderColor}" stroke-width="2" />`,
      `<rect x="${formatNumber(plan.renderX)}" y="${formatNumber(plan.renderY)}" width="${formatNumber(plan.renderWidth)}" height="${formatNumber(plan.renderHeight)}" fill="none" stroke="${debugBoundsColor}" stroke-width="2" stroke-dasharray="7 5" />`,
      paths,
      `<text x="${formatNumber(plan.cellX + 8)}" y="${formatNumber(plan.cellY + 18)}" font-size="14" font-weight="700" fill="#444">${escapeXml(plan.drawing.expectedKana)}</text>`,
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF" />`,
    cells,
    '</svg>',
  ].join('\n');
}

function buildDebugCellSvg(
  drawing: MemoryHandwritingDrawing,
  bounds: DrawingBounds,
  render: {
    renderHeight: number;
    renderWidth: number;
    renderX: number;
    renderY: number;
    scale: number;
  },
) {
  const paths = buildDebugPaths(drawing, bounds, render.scale, render.renderX, render.renderY);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cellSize}" height="${cellSize}" viewBox="0 0 ${cellSize} ${cellSize}">`,
    `<rect x="0" y="0" width="${cellSize}" height="${cellSize}" fill="#FFFFFF" stroke="${debugBorderColor}" stroke-width="2" />`,
    `<rect x="${formatNumber(render.renderX)}" y="${formatNumber(render.renderY)}" width="${formatNumber(render.renderWidth)}" height="${formatNumber(render.renderHeight)}" fill="none" stroke="${debugBoundsColor}" stroke-width="2" stroke-dasharray="7 5" />`,
    paths,
    '</svg>',
  ].join('\n');
}

function buildDebugPaths(
  drawing: MemoryHandwritingDrawing,
  bounds: DrawingBounds,
  scale: number,
  renderX: number,
  renderY: number,
) {
  return drawing.strokes
    .map((stroke) => stroke.filter(isFinitePoint).map((point) => ({
      x: renderX + (point.x - bounds.x) * scale,
      y: renderY + (point.y - bounds.y) * scale,
    })))
    .map((stroke) => {
      const path = buildStrokeSvgPath(stroke, outputStrokeWidth);

      if (!path) {
        return '';
      }

      return `<path d="${path}" fill="none" stroke="#000000" stroke-width="${outputStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .filter(Boolean)
    .join('\n');
}

function encodeGrayscalePng(width: number, height: number, image: Uint8Array) {
  const scanlineLength = width + 1;
  const raw = new Uint8Array(scanlineLength * height);

  for (let row = 0; row < height; row += 1) {
    const rawOffset = row * scanlineLength;
    raw[rawOffset] = 0;
    raw.set(image.subarray(row * width, (row + 1) * width), rawOffset + 1);
  }

  return concatBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    makePngChunk('IHDR', concatBytes([
      uint32Bytes(width),
      uint32Bytes(height),
      new Uint8Array([8, 0, 0, 0, 0]),
    ])),
    makePngChunk('IDAT', buildStoredZlibStream(raw)),
    makePngChunk('IEND', new Uint8Array()),
  ]);
}

function buildStoredZlibStream(raw: Uint8Array) {
  const blockSize = 65535;
  const blockCount = Math.ceil(raw.length / blockSize);
  const output = new Uint8Array(2 + raw.length + blockCount * 5 + 4);
  let offset = 0;
  output[offset] = 0x78;
  output[offset + 1] = 0x01;
  offset += 2;

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const start = blockIndex * blockSize;
    const end = Math.min(raw.length, start + blockSize);
    const length = end - start;
    const isFinal = blockIndex === blockCount - 1;

    output[offset] = isFinal ? 1 : 0;
    output[offset + 1] = length & 0xff;
    output[offset + 2] = (length >> 8) & 0xff;
    output[offset + 3] = (~length) & 0xff;
    output[offset + 4] = ((~length) >> 8) & 0xff;
    offset += 5;
    output.set(raw.subarray(start, end), offset);
    offset += length;
  }

  output.set(uint32Bytes(adler32(raw)), offset);
  return output;
}

function makePngChunk(type: string, data: Uint8Array) {
  const typeBytes = asciiBytes(type);
  const crcInput = concatBytes([typeBytes, data]);

  return concatBytes([
    uint32Bytes(data.length),
    typeBytes,
    data,
    uint32Bytes(crc32(crcInput)),
  ]);
}

function adler32(data: Uint8Array) {
  let a = 1;
  let b = 0;

  for (const value of data) {
    a = (a + value) % 65521;
    b = (b + a) % 65521;
  }

  return ((b << 16) | a) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;

  for (const value of data) {
    crc = crcTable[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]) {
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;

  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });

  return output;
}

function uint32Bytes(value: number) {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function asciiBytes(value: string) {
  return new Uint8Array(value.split('').map((character) => character.charCodeAt(0)));
}

function encodeBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const triplet = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += alphabet[(triplet >> 18) & 63];
    output += alphabet[(triplet >> 12) & 63];
    output += index + 1 < bytes.length ? alphabet[(triplet >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? alphabet[triplet & 63] : '=';
  }

  return output;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(3);
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isMemoryDrawing(
  drawing: MemoryHandwritingDrawing | undefined,
): drawing is MemoryHandwritingDrawing {
  return Boolean(drawing);
}

function isFinitePoint(point: StrokePoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}
