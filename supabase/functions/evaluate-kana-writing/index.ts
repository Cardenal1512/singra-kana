// @ts-nocheck

type EvaluationStatus = 'perfect' | 'good' | 'almost' | 'wrong';
type EvaluationSeverity = 'minor' | 'medium' | 'major';

type EvaluateKanaWritingRequest = {
  collageBase64: string;
  expectedKanaOrder: string[];
};

type OpenAIEvaluationResult = {
  expectedKana: string;
  detectedKana: string | null;
  status: EvaluationStatus;
  severity: EvaluationSeverity;
  confidence: number;
  confusedWith: string | null;
};

type OpenAIEvaluationPayload = {
  results: OpenAIEvaluationResult[];
  summary: {
    kana: string;
    message: string;
  }[];
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const openAIResponsesUrl = 'https://api.openai.com/v1/responses';

const systemPrompt = `You are an educational Japanese kana handwriting evaluator.
Evaluate a collage of beginner handwritten kana.
Return only valid JSON matching the schema.
Use the expectedKanaOrder to read cells left-to-right, top-to-bottom.
Be tolerant of beginner handwriting, but mark kana as wrong when they are not recognizable.`;

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

    console.info('[evaluate-kana-writing] request received', {
      collageLength: input.collageBase64.length,
      expectedKanaOrder: input.expectedKanaOrder,
      requestId,
    });

    if (!openAIKey) {
      console.error('[evaluate-kana-writing] OPENAI_API_KEY is not configured', { requestId });
      return jsonResponse({ error: 'OPENAI_API_KEY is not configured' }, 500);
    }

    const payload = await evaluateWithOpenAI(input, openAIKey);
    const cleanPayload = validateEvaluationPayload(payload, input.expectedKanaOrder);

    console.info('[evaluate-kana-writing] evaluation completed', { requestId });
    return jsonResponse(cleanPayload, 200);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Unexpected evaluation error';

    console.error('[evaluate-kana-writing] failed', {
      message,
      requestId,
      status,
    });

    return jsonResponse({ error: message }, status);
  }
});

async function parseAndValidateRequest(request: Request): Promise<EvaluateKanaWritingRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }

  if (!isRecord(body)) {
    throw new HttpError('Invalid request body', 400);
  }

  const collageBase64 = normalizeBase64(body.collageBase64);
  const expectedKanaOrder = body.expectedKanaOrder;

  if (!collageBase64) {
    throw new HttpError('collageBase64 is required', 400);
  }

  if (!Array.isArray(expectedKanaOrder)) {
    throw new HttpError('expectedKanaOrder is required', 400);
  }

  if (expectedKanaOrder.length === 0) {
    throw new HttpError('expectedKanaOrder must not be empty', 400);
  }

  if (expectedKanaOrder.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new HttpError('expectedKanaOrder must contain only kana strings', 400);
  }

  return {
    collageBase64,
    expectedKanaOrder: expectedKanaOrder.map((item) => item.trim()),
  };
}

async function evaluateWithOpenAI(
  input: EvaluateKanaWritingRequest,
  openAIKey: string,
): Promise<OpenAIEvaluationPayload> {
  const response = await fetch(openAIResponsesUrl, {
    body: JSON.stringify(buildOpenAIRequest(input)),
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed with status ${response.status}: ${errorBody.slice(0, 400)}`);
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error('OpenAI returned an empty response');
  }

  try {
    return JSON.parse(outputText) as OpenAIEvaluationPayload;
  } catch {
    throw new Error('OpenAI returned invalid JSON');
  }
}

function buildOpenAIRequest(input: EvaluateKanaWritingRequest) {
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
              order: 'left-to-right top-to-bottom',
            }),
            type: 'input_text',
          },
          {
            detail: 'high',
            image_url: `data:image/png;base64,${input.collageBase64}`,
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
        name: 'kana_writing_evaluation',
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
          severity: {
            enum: ['minor', 'medium', 'major'],
            type: 'string',
          },
          status: {
            enum: ['perfect', 'good', 'almost', 'wrong'],
            type: 'string',
          },
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
          message: { type: 'string' },
        },
        required: ['kana', 'message'],
        type: 'object',
      },
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

  return {
    results: payload.results.map((result, index) => validateResult(result, expectedKanaOrder[index])),
    summary: payload.summary.slice(0, 3).map(validateSummaryItem),
  };
}

function validateResult(result: unknown, expectedKana: string): OpenAIEvaluationResult {
  if (!isRecord(result)) {
    throw new Error('Invalid result item');
  }

  const status = result.status;
  const severity = result.severity;
  const confidence = result.confidence;

  if (!['perfect', 'good', 'almost', 'wrong'].includes(status)) {
    throw new Error('Invalid status');
  }

  if (!['minor', 'medium', 'major'].includes(severity)) {
    throw new Error('Invalid severity');
  }

  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error('Invalid confidence');
  }

  return {
    confidence,
    confusedWith: typeof result.confusedWith === 'string' ? result.confusedWith : null,
    detectedKana: typeof result.detectedKana === 'string' ? result.detectedKana : null,
    expectedKana,
    severity,
    status,
  };
}

function validateSummaryItem(item: unknown) {
  if (!isRecord(item) || typeof item.kana !== 'string' || typeof item.message !== 'string') {
    throw new Error('Invalid summary item');
  }

  return {
    kana: item.kana,
    message: item.message.slice(0, 80),
  };
}

function extractOutputText(payload: unknown) {
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

  const dataUrlMatch = value.match(/^data:[^;]+;base64,(.+)$/u);
  return (dataUrlMatch?.[1] ?? value).replace(/\s/g, '');
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
