import type { HandwritingEvaluationPort } from '@/src/features/hiragana/domain/ports/HandwritingEvaluationPort';
import { MockHandwritingEvaluationAdapter } from '@/src/features/hiragana/infrastructure/services/MockHandwritingEvaluationAdapter';
import { OpenAIHandwritingEvaluationAdapter } from '@/src/features/hiragana/infrastructure/services/OpenAIHandwritingEvaluationAdapter';
import { supabaseClient, supabaseConfig } from '@/src/infrastructure/supabase/supabaseClient';

const provider = process.env.EXPO_PUBLIC_HANDWRITING_EVALUATION_PROVIDER;

export function createHandwritingEvaluationPort(): HandwritingEvaluationPort {
  const selectedMode = provider ?? 'auto';

  console.log('[EVALUATION_MODE] Selected mode', {
    hasPublishableKey: Boolean(supabaseConfig.publishableKey),
    hasSupabaseClient: Boolean(supabaseClient),
    provider: selectedMode,
    targetFunction: 'evaluate-kana-writing',
  });

  if (provider === 'mock') {
    console.log('[EVALUATION_MODE] Using MOCK evaluator', {
      reason: 'provider forced to mock',
    });
    return new MockHandwritingEvaluationAdapter();
  }

  if (!supabaseClient) {
    console.log('[EVALUATION_MODE] Using MOCK evaluator', {
      reason: 'missing Supabase client',
    });
    return new MockHandwritingEvaluationAdapter();
  }

  console.log('[EVALUATION_MODE] Using AI evaluator', {
    targetFunction: 'evaluate-kana-writing',
  });
  return new OpenAIHandwritingEvaluationAdapter({
    client: supabaseClient,
  });
}
