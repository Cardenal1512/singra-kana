// @ts-nocheck

type EvaluationStatus = 'perfect' | 'good' | 'almost' | 'wrong';
type EvaluationSeverity = 'minor' | 'medium' | 'major';
type EvaluationLayout = '1x5' | '2x5' | '4x5';

type EvaluateHandwritingRequest = {
  expectedKanaOrder: string[];
  imageBase64: string;
  imageMimeType?: string;
  layout: EvaluationLayout;
  metadata?: {
    canvasSize?: {
      height: number;
      width: number;
    };
    kanaCount?: number;
    strokeWidth?: number;
  };
  order: 'left-to-right top-to-bottom';
};

type OpenAIEvaluationResult = {
  expectedKana: string;
  detectedKana: string | null;
  status: EvaluationStatus;
  severity: EvaluationSeverity;
  confidence: number;
  confusedWith: string | null;
};

type OpenAISummaryItem = {
  kana: string;
  message: string;
};

type OpenAIEvaluationPayload = {
  results: OpenAIEvaluationResult[];
  summary: OpenAISummaryItem[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const openAIResponsesUrl = 'https://api.openai.com/v1/responses';
const systemPrompt = `You are an educational Japanese kana handwriting evaluator.

Your task:
Evaluate handwritten kana drawings from beginner students.

Goals:
- prioritize recognizability
- tolerate imperfect handwriting
- detect major kana confusions
- avoid excessive criticism

You must:
- return ONLY valid JSON
- never return markdown
- never explain outside JSON
- follow the schema exactly

Evaluation statuses:
- perfect
- good
- almost
- wrong

Severity:
- minor
- medium
- major

A major severity means:
- the kana strongly resembles another kana
- or is difficult to recognize

Only generate summary feedback for:
- major confusions
- repeated mistakes
- clearly incorrect kana

Ignore small imperfections.

Keep feedback extremely short.`;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const requestId = crypto.randomUUID();

  try {
    const input = await parseAndValidateRequest(request);
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIKey) {
      console.error('[evaluate-handwriting] Missing OPENAI_API_KEY', { requestId });
      return jsonResponse({ error: 'Evaluation backend is not configured' }, 503);
    }

    console.info('[evaluate-handwriting] Evaluating handwriting', {
      layout: input.layout,
      metadata: input.metadata,
      requestId,
      seriesSize: input.expectedKanaOrder.length,
    });

    const payload = await evaluateWithRetry(input, openAIKey);
    const cleanPayload = validateEvaluationPayload(payload, input.expectedKanaOrder);

    return jsonResponse(cleanPayload, 200);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Unexpected evaluation error';

    console.error('[evaluate-handwriting] Failed', {
      message,
      requestId,
      status,
    });

    return jsonResponse({ error: message }, status);
  }
});

async function parseAndValidateRequest(request: Request): Promise<EvaluateHandwritingRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }

  if (!isRecord(body)) {
    throw new HttpError('Invalid request body', 400);
  }

  const layout = body.layout;
  const order = body.order;
  const expectedKanaOrder = body.expectedKanaOrder;
  const rawImageBase64 = body.collageBase64 ?? body.imageBase64;
  const imageBase64 = normalizeBase64(rawImageBase64);
  const imageMimeType = normalizeMimeType(body.imageMimeType, rawImageBase64);
  const metadata = normalizeMetadata(body.metadata);

  if (!isLayout(layout)) {
    throw new HttpError('Invalid layout', 400);
  }

  if (order !== 'left-to-right top-to-bottom') {
    throw new HttpError('Invalid order', 400);
  }

  if (!Array.isArray(expectedKanaOrder) || expectedKanaOrder.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new HttpError('Invalid expectedKanaOrder', 400);
  }

  const expectedCount = getExpectedCount(layout);

  if (expectedKanaOrder.length !== expectedCount) {
    throw new HttpError(`expectedKanaOrder must contain ${expectedCount} kana for ${layout}`, 400);
  }

  if (!imageBase64) {
    throw new HttpError('Missing collageBase64', 400);
  }

  if (!isSupportedMimeType(imageMimeType)) {
    throw new HttpError('Unsupported image type. Use PNG, JPEG, WEBP, or non-animated GIF.', 400);
  }

  const imageBytes = estimateBase64Bytes(imageBase64);
  const maxImageBytes = getMaxImageBytes();

  if (imageBytes > maxImageBytes) {
    throw new HttpError('Image is too large', 413);
  }

  return {
    expectedKanaOrder: expectedKanaOrder.map((item) => item.trim()),
    imageBase64,
    imageMimeType,
    layout,
    metadata,
    order,
  };
}

async function evaluateWithRetry(
  input: EvaluateHandwritingRequest,
  openAIKey: string,
): Promise<OpenAIEvaluationPayload> {
  const attempts = getRetryCount() + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await evaluateWithOpenAI(input, openAIKey);
    } catch (error) {
      lastError = error;

      if (attempt >= attempts || error instanceof HttpError) {
        break;
      }

      await delay(250 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenAI evaluation failed');
}

async function evaluateWithOpenAI(
  input: EvaluateHandwritingRequest,
  openAIKey: string,
): Promise<OpenAIEvaluationPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());
  const response = await fetch(openAIResponsesUrl, {
    body: JSON.stringify(buildOpenAIRequest(input)),
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    const body = await safeReadText(response);
    throw new Error(`OpenAI responded ${response.status}: ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error('OpenAI returned no JSON output');
  }

  try {
    return JSON.parse(outputText) as OpenAIEvaluationPayload;
  } catch {
    throw new Error('OpenAI returned invalid JSON');
  }
}

function buildOpenAIRequest(input: EvaluateHandwritingRequest) {
  return {
    input: [
      {
        content: [
          {
            text: systemPrompt,
            type: 'input_text',
          },
        ],
        role: 'system',
      },
      {
        content: [
          {
            text: JSON.stringify({
              expectedKanaOrder: input.expectedKanaOrder,
              layout: input.layout,
              metadata: input.metadata,
              order: input.order,
            }),
            type: 'input_text',
          },
          {
            detail: 'high',
            image_url: `data:${input.imageMimeType};base64,${input.imageBase64}`,
            type: 'input_image',
          },
        ],
        role: 'user',
      },
    ],
    max_output_tokens: 1200,
    model: Deno.env.get('OPENAI_HANDWRITING_MODEL') ?? 'gpt-4.1-mini',
    temperature: 0,
    text: {
      format: {
        name: 'kana_handwriting_evaluation',
        schema: responseSchema,
        strict: true,
        type: 'json_schema',
      },
    },
  };
}

const responseSchema = {
  additionalProperties: false,
  properties: {
    results: {
      items: {
        additionalProperties: false,
        properties: {
          confidence: { maximum: 1, minimum: 0, type: 'number' },
          confusedWith: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
          },
          detectedKana: {
            anyOf: [{ type: 'string' }, { type: 'null' }],
          },
          expectedKana: { type: 'string' },
          severity: { enum: ['minor', 'medium', 'major'], type: 'string' },
          status: { enum: ['perfect', 'good', 'almost', 'wrong'], type: 'string' },
        },
        required: [
          'expectedKana',
          'detectedKana',
          'status',
          'severity',
          'confidence',
          'confusedWith',
        ],
        type: 'object',
      },
      type: 'array',
    },
    summary: {
      items: {
        additionalProperties: false,
        properties: {
          kana: { type: 'string' },
          message: { maxLength: 80, type: 'string' },
        },
        required: ['kana', 'message'],
        type: 'object',
      },
      maxItems: 3,
      type: 'array',
    },
  },
  required: ['results', 'summary'],
  type: 'object',
};

function validateEvaluationPayload(
  payload: OpenAIEvaluationPayload,
  expectedKanaOrder: string[],
): OpenAIEvaluationPayload {
  if (!isRecord(payload) || !Array.isArray(payload.results) || !Array.isArray(payload.summary)) {
    throw new Error('Evaluation JSON does not match expected shape');
  }

  if (payload.results.length !== expectedKanaOrder.length) {
    throw new Error('Evaluation result count does not match expected kana count');
  }

  const results = payload.results.map((result, index) =>
    validateResult(result, expectedKanaOrder[index]),
  );
  const summary = payload.summary.slice(0, 3).map(validateSummaryItem);

  return { results, summary };
}

function validateResult(result: unknown, expectedKana: string): OpenAIEvaluationResult {
  if (!isRecord(result)) {
    throw new Error('Invalid result item');
  }

  const status = result.status;
  const severity = result.severity;
  const confidence = result.confidence;
  const confusedWith = result.confusedWith;
  const detectedKana = result.detectedKana;

  if (!isStatus(status) || !isSeverity(severity)) {
    throw new Error('Invalid result status or severity');
  }

  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error('Invalid confidence');
  }

  return {
    expectedKana,
    detectedKana: typeof detectedKana === 'string' ? detectedKana : null,
    status,
    severity,
    confidence,
    confusedWith: typeof confusedWith === 'string' ? confusedWith : null,
  };
}

function validateSummaryItem(item: unknown): OpenAISummaryItem {
  if (!isRecord(item) || typeof item.kana !== 'string' || typeof item.message !== 'string') {
    throw new Error('Invalid summary item');
  }

  return {
    kana: item.kana,
    message: item.message.slice(0, 80),
  };
}

function extractOutputText(payload: unknown) {
  if (isRecord(payload) && typeof payload.output_text === 'string') {
    return payload.output_text;
  }

  if (!isRecord(payload) || !Array.isArray(payload.output)) {
    return undefined;
  }

  for (const outputItem of payload.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (isRecord(contentItem) && typeof contentItem.text === 'string') {
        return contentItem.text;
      }
    }
  }

  return undefined;
}

function normalizeBase64(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const dataUrlMatch = value.match(/^data:([^;]+);base64,(.+)$/u);
  return (dataUrlMatch?.[2] ?? value).replace(/\s/g, '');
}

function normalizeMimeType(mimeType: unknown, imageBase64: unknown) {
  if (typeof mimeType === 'string') {
    return mimeType;
  }

  if (typeof imageBase64 === 'string') {
    const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,/u);
    if (dataUrlMatch?.[1]) {
      return dataUrlMatch[1];
    }
  }

  return 'image/png';
}

function normalizeMetadata(metadata: unknown) {
  if (!isRecord(metadata)) {
    return undefined;
  }

  const canvasSize = isRecord(metadata.canvasSize)
    && typeof metadata.canvasSize.width === 'number'
    && typeof metadata.canvasSize.height === 'number'
    ? {
        height: metadata.canvasSize.height,
        width: metadata.canvasSize.width,
      }
    : undefined;
  const kanaCount = typeof metadata.kanaCount === 'number' ? metadata.kanaCount : undefined;
  const strokeWidth = typeof metadata.strokeWidth === 'number' ? metadata.strokeWidth : undefined;

  return {
    canvasSize,
    kanaCount,
    strokeWidth,
  };
}

function getExpectedCount(layout: EvaluationLayout) {
  return layout === '1x5' ? 5 : layout === '2x5' ? 10 : 20;
}

function getMaxImageBytes() {
  return Number(Deno.env.get('MAX_HANDWRITING_IMAGE_BYTES') ?? 6 * 1024 * 1024);
}

function getRetryCount() {
  return Number(Deno.env.get('OPENAI_HANDWRITING_RETRIES') ?? 1);
}

function getTimeoutMs() {
  return Number(Deno.env.get('OPENAI_HANDWRITING_TIMEOUT_MS') ?? 20000);
}

function estimateBase64Bytes(value: string) {
  return Math.ceil((value.length * 3) / 4);
}

function isSupportedMimeType(value: string) {
  return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(value);
}

function isLayout(value: unknown): value is EvaluationLayout {
  return value === '1x5' || value === '2x5' || value === '4x5';
}

function isStatus(value: unknown): value is EvaluationStatus {
  return value === 'perfect' || value === 'good' || value === 'almost' || value === 'wrong';
}

function isSeverity(value: unknown): value is EvaluationSeverity {
  return value === 'minor' || value === 'medium' || value === 'major';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
