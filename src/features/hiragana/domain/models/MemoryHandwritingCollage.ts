export type MemoryHandwritingCollageLayout = {
  columns: number;
  rows: number;
};

export type MemoryHandwritingCollageDebugCell = {
  bounds: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  expectedKana: string;
  height: number;
  render: {
    height: number;
    scale: number;
    strokeWidth: number;
    width: number;
    x: number;
    y: number;
  };
  svgXml: string;
  width: number;
};

export type MemoryHandwritingCollage = {
  debugCells: MemoryHandwritingCollageDebugCell[];
  height: number;
  imageBase64: string;
  layout: MemoryHandwritingCollageLayout;
  localUri: string;
  mimeType: 'image/png';
  svgXml: string;
  strokeWidth: number;
  width: number;
};
