// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jishoSearchUrl = 'https://jisho.org/api/v1/search/words';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let query = '';

  try {
    const body = await request.json();
    query = String(body.query ?? '').trim();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!query) {
    return jsonResponse({ error: 'Missing query' }, 400);
  }

  try {
    const response = await searchJisho(query);

    if (!response.ok) {
      const fallbackQuery = katakanaToRomaji(query);

      if (fallbackQuery && fallbackQuery !== query) {
        const fallbackResponse = await searchJisho(fallbackQuery);

        if (fallbackResponse.ok) {
          const fallbackPayload = await fallbackResponse.json();
          return jsonResponse(fallbackPayload, 200);
        }

        const fallbackBody = await safeReadText(fallbackResponse);
        const body = await safeReadText(response);
        return jsonResponse(
          {
            error: `Jisho responded ${response.status} ${response.statusText}`,
            body: body.slice(0, 500),
            fallbackQuery,
            fallbackError: `Jisho fallback responded ${fallbackResponse.status} ${fallbackResponse.statusText}`,
            fallbackBody: fallbackBody.slice(0, 500),
          },
          502,
        );
      }

      const body = await safeReadText(response);
      return jsonResponse(
        {
          error: `Jisho responded ${response.status} ${response.statusText}`,
          body: body.slice(0, 500),
        },
        502,
      );
    }

    const payload = await response.json();
    return jsonResponse(payload, 200);
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
});

function searchJisho(query: string) {
  return fetch(`${jishoSearchUrl}?keyword=${encodeURIComponent(query)}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'singra-kana/1.0',
    },
  });
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

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

const katakanaRomaji: Record<string, string> = {
  ア: 'a',
  イ: 'i',
  ウ: 'u',
  エ: 'e',
  オ: 'o',
  カ: 'ka',
  キ: 'ki',
  ク: 'ku',
  ケ: 'ke',
  コ: 'ko',
  サ: 'sa',
  シ: 'shi',
  ス: 'su',
  セ: 'se',
  ソ: 'so',
  タ: 'ta',
  チ: 'chi',
  ツ: 'tsu',
  テ: 'te',
  ト: 'to',
  ナ: 'na',
  ニ: 'ni',
  ヌ: 'nu',
  ネ: 'ne',
  ノ: 'no',
  ハ: 'ha',
  ヒ: 'hi',
  フ: 'fu',
  ヘ: 'he',
  ホ: 'ho',
  マ: 'ma',
  ミ: 'mi',
  ム: 'mu',
  メ: 'me',
  モ: 'mo',
  ヤ: 'ya',
  ユ: 'yu',
  ヨ: 'yo',
  ラ: 'ra',
  リ: 'ri',
  ル: 'ru',
  レ: 're',
  ロ: 'ro',
  ワ: 'wa',
  ヲ: 'wo',
  ン: 'n',
  ガ: 'ga',
  ギ: 'gi',
  グ: 'gu',
  ゲ: 'ge',
  ゴ: 'go',
  ザ: 'za',
  ジ: 'ji',
  ズ: 'zu',
  ゼ: 'ze',
  ゾ: 'zo',
  ダ: 'da',
  ヂ: 'ji',
  ヅ: 'zu',
  デ: 'de',
  ド: 'do',
  バ: 'ba',
  ビ: 'bi',
  ブ: 'bu',
  ベ: 'be',
  ボ: 'bo',
  パ: 'pa',
  ピ: 'pi',
  プ: 'pu',
  ペ: 'pe',
  ポ: 'po',
  ヴ: 'vu',
};

function katakanaToRomaji(value: string) {
  let result = '';
  let doubleNextConsonant = false;

  for (const character of value) {
    if (character === 'ッ') {
      doubleNextConsonant = true;
      continue;
    }

    if (character === 'ー') {
      result += result.at(-1) ?? '';
      continue;
    }

    const romaji = katakanaRomaji[character];

    if (!romaji) {
      result += character;
      continue;
    }

    if (doubleNextConsonant) {
      result += romaji[0];
      doubleNextConsonant = false;
    }

    result += romaji;
  }

  return result;
}
