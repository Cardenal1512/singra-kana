// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const generatedVocabularyBucket = 'vocabulary-generated';
const defaultReferenceBucket = 'references';
const defaultReferencePath = 'singra.png';
const openAiImageModel = 'chatgpt-image-latest';
const openAiImageQuality = 'medium';
const openAiImageEditUrl = 'https://api.openai.com/v1/images/edits';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!openAiApiKey) {
    return jsonResponse({ error: 'OPENAI_API_KEY is not configured' }, 500);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase service role is not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await readJsonBody(request);

  if ('error' in body) {
    return jsonResponse({ error: body.error }, 400);
  }

  const draftId = String(body.draftId ?? '').trim();
  const imagePrompt = String(body.imagePrompt ?? '').trim();
  const referenceImageBucket = String(body.referenceImageBucket ?? defaultReferenceBucket).trim();
  const referenceImagePath = String(body.referenceImagePath ?? defaultReferencePath).trim();

  if (!draftId || !imagePrompt) {
    return jsonResponse({ error: 'Missing draftId or imagePrompt' }, 400);
  }

  await updateDraftImageStatus(supabase, draftId, {
    image_generation_status: 'generating',
    image_generation_error: null,
  });

  try {
    const referenceImage = await downloadReferenceImage(
      supabase,
      referenceImageBucket,
      referenceImagePath,
    );
    const imageBytes = await generateImage(openAiApiKey, imagePrompt, referenceImage);
    const imagePath = `${draftId}/generated.webp`;

    const uploadResult = await supabase.storage
      .from(generatedVocabularyBucket)
      .upload(imagePath, imageBytes, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (uploadResult.error) {
      throw new Error(`Storage upload failed: ${uploadResult.error.message}`);
    }

    const draft = await updateDraftImageStatus(supabase, draftId, {
      generated_image_path: imagePath,
      image_generation_status: 'generated',
      image_generation_error: null,
    });

    return jsonResponse(draft, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const draft = await updateDraftImageStatus(supabase, draftId, {
      image_generation_status: 'failed',
      image_generation_error: errorMessage,
    });

    return jsonResponse(draft, 500);
  }
});

async function generateImage(openAiApiKey: string, prompt: string, referenceImage: Blob) {
  const formData = new FormData();
  formData.append('model', openAiImageModel);
  formData.append('prompt', withCanonicalColorGuidance(prompt));
  formData.append('image', referenceImage, 'singra.png');
  formData.append('size', '1024x1024');
  formData.append('quality', openAiImageQuality);
  formData.append('background', 'transparent');
  formData.append('output_format', 'webp');
  formData.append('n', '1');

  const response = await fetch(openAiImageEditUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: formData,
  });

  const payload = await readOpenAiPayload(response);

  if (!response.ok) {
    throw new Error(`OpenAI image generation failed: ${JSON.stringify(payload).slice(0, 500)}`);
  }

  const base64Image = payload.data?.[0]?.b64_json;

  if (!base64Image) {
    throw new Error('OpenAI did not return image data');
  }

  return Uint8Array.from(atob(base64Image), (character) => character.charCodeAt(0));
}

async function readOpenAiPayload(response: Response) {
  try {
    return await response.json();
  } catch {
    return { error: await response.text() };
  }
}

function withCanonicalColorGuidance(prompt: string) {
  return `${prompt}

Additional Singra identity constraints:
Use the provided reference image only to preserve Singra's identity.
Singra must remain the same mascot: rounded yellow body, orange hoodie, black beanie with red symbol, spiral glasses, cute face, and same proportions.
Do not transform Singra into the word.
Do not change Singra's body shape.
Do not create a standalone animal or object.
Represent the word only through one simple prop, one small costume detail, or one clear pose/action.
Use word-related colors only as subtle secondary accents.`;
}

async function downloadReferenceImage(supabase, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(`Could not download reference image: ${error?.message ?? 'missing image data'}`);
  }

  return data;
}

async function updateDraftImageStatus(supabase, draftId: string, values: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('vocabulary_draft')
    .update(values)
    .eq('id', draftId)
    .select(
      [
        'id',
        'japanese',
        'reading_kana',
        'romaji',
        'meaning_es',
        'meaning_en',
        'main_kana',
        'kana_series',
        'writing_system',
        'image_prompt',
        'image_prompt_style_version',
        'image_prompt_reference_bucket',
        'image_prompt_reference_path',
        'generated_image_path',
        'image_generation_status',
        'image_generation_error',
        'status',
        'source',
        'created_at',
        'updated_at',
      ].join(','),
    )
    .single();

  if (error) {
    throw new Error(`Could not update draft image status: ${error.message}`);
  }

  return data;
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return { error: 'Invalid JSON body' };
  }
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
