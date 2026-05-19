import type { DictionaryCandidate } from '@/src/features/hiragana/domain/models/DictionaryCandidate';
import type { DictionaryRepository } from '@/src/features/hiragana/domain/repositories/DictionaryRepository';
import {
  mapJishoEntriesToDictionaryCandidates,
  type JishoResponse,
} from '@/src/features/hiragana/infrastructure/mappers/JishoDictionaryMapper';

const jishoSearchUrl = 'https://jisho.org/api/v1/search/words';

export class JishoDictionaryRepository implements Pick<DictionaryRepository, 'searchExternal'> {
  async searchExternal(query: string): Promise<DictionaryCandidate[]> {
    const url = `${jishoSearchUrl}?keyword=${encodeURIComponent(query)}`;
    let response: Response;

    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        `Jisho request failed for "${query}": ${getErrorMessage(error)}. ` +
          'If this happens on Expo web, the browser may be blocking Jisho by CORS before the API response is available.',
      );
    }

    if (!response.ok) {
      const body = await readResponseBody(response);
      throw new Error(
        `Jisho responded ${response.status} ${response.statusText} for "${query}"${body ? `: ${body}` : ''}`,
      );
    }

    let payload: JishoResponse;

    try {
      payload = (await response.json()) as JishoResponse;
    } catch (error) {
      throw new Error(`Jisho returned invalid JSON for "${query}": ${getErrorMessage(error)}`);
    }

    if (payload.meta.status !== 200) {
      throw new Error(`Jisho payload status was ${payload.meta.status} for "${query}"`);
    }

    return mapJishoEntriesToDictionaryCandidates(payload.data, query);
  }
}

async function readResponseBody(response: Response) {
  try {
    return (await response.text()).slice(0, 220);
  } catch {
    return '';
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
