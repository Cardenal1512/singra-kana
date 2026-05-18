const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'singra-eval-'));

const sourceFile = path.join(
  repoRoot,
  'src/features/hiragana/application/useCases/evaluateRelaxedWriting.ts',
);
const compiledFile = path.join(tempDir, 'evaluateRelaxedWriting.js');
const compiled = ts.transpileModule(fs.readFileSync(sourceFile, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
fs.writeFileSync(compiledFile, compiled.outputText);

const canvasSize = { width: 300, height: 300 };
const simpleLine = [
  [
    { x: 80, y: 150 },
    { x: 220, y: 150 },
  ],
];
const shortLine = [
  [
    { x: 130, y: 130 },
    { x: 165, y: 150 },
  ],
];
const circleLikeStroke = [
  [
    { x: 150, y: 90 },
    { x: 205, y: 140 },
    { x: 180, y: 210 },
    { x: 110, y: 200 },
    { x: 95, y: 130 },
    { x: 150, y: 90 },
  ],
];

const cases = [
  {
    name: 'お: una linea simple no es Perfecto',
    kana: 'お',
    strokes: simpleLine,
    maxCategory: 'almost',
  },
  {
    name: 'あ: solo un circulo no es Perfecto',
    kana: 'あ',
    strokes: circleLikeStroke,
    maxCategory: 'almost',
  },
  {
    name: 'あ: solo una linea no es Perfecto',
    kana: 'あ',
    strokes: simpleLine,
    maxCategory: 'almost',
  },
  {
    name: 'う: una linea corta no es Perfecto',
    kana: 'う',
    strokes: shortLine,
    maxCategory: 'almost',
  },
];

const rank = {
  almost: 0,
  good: 1,
  great: 2,
  perfect: 3,
};

const { evaluateRelaxedWriting } = require(compiledFile);

for (const testCase of cases) {
  const result = evaluateRelaxedWriting({
    canvasSize,
    kana: testCase.kana,
    strokes: testCase.strokes,
  });

  if (rank[result.category] > rank[testCase.maxCategory]) {
    throw new Error(
      `${testCase.name}: expected max ${testCase.maxCategory}, got ${result.category} (${result.score})`,
    );
  }

  console.log(`${testCase.name}: ${result.category} (${result.score})`);
}
