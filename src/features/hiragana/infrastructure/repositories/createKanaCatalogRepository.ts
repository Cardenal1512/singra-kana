import type { KanaCatalogRepository } from '@/src/features/hiragana/domain/repositories/KanaCatalogRepository';
import { supabaseClient } from '@/src/infrastructure/supabase/supabaseClient';
import { FallbackKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/FallbackKanaCatalogRepository';
import { LocalKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/LocalKanaCatalogRepository';
import { SupabaseKanaCatalogRepository } from '@/src/features/hiragana/infrastructure/repositories/SupabaseKanaCatalogRepository';

export function createKanaCatalogRepository(): KanaCatalogRepository {
  const localRepository = new LocalKanaCatalogRepository();

  if (!supabaseClient) {
    return localRepository;
  }

  return new FallbackKanaCatalogRepository(
    new SupabaseKanaCatalogRepository(supabaseClient),
    localRepository,
  );
}
