import { supabase } from '@/integrations/supabase/client';
import { CompetitorPage } from '@/types/database';

export interface SearchResult {
  page: CompetitorPage & { competitor_name: string; competitor_id: string };
  snippet: string;
  matchPositions: number[];
}

export interface SavedSearch {
  id: string;
  query: string;
  category: string | null;
  competitor_ids: string[];
  created_at: string;
}

const SAVED_SEARCHES_KEY = 'competitoriq_saved_searches';

// Client-side full-text search across all scraped content
export async function searchContent(
  query: string,
  options?: {
    competitorIds?: string[];
    category?: string;
  }
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  let qb = supabase
    .from('competitor_pages')
    .select('*, competitors!inner(name, id)')
    .order('updated_at', { ascending: false });

  if (options?.competitorIds && options.competitorIds.length > 0) {
    qb = qb.in('competitor_id', options.competitorIds);
  }

  const { data, error } = await qb;
  if (error) throw error;
  if (!data) return [];

  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const row of data) {
    const page = {
      ...row,
      competitor_name: (row as any).competitors?.name ?? 'Unknown',
      competitors: undefined,
    } as SearchResult['page'];

    const category = (page.metadata as any)?.category ?? 'Uncategorized';
    if (options?.category && category !== options.category) continue;

    // Search across title, url, markdown_content, description
    const fields = [
      page.title ?? '',
      page.url,
      page.markdown_content ?? '',
      page.description ?? '',
    ];
    const combined = fields.join(' ').toLowerCase();

    const allMatch = terms.every((t) => combined.includes(t));
    if (!allMatch) continue;

    // Generate snippet
    const contentToSearch = page.markdown_content ?? page.description ?? page.url;
    const snippet = generateSnippet(contentToSearch, terms);
    const matchPositions = terms.map((t) => combined.indexOf(t)).filter((p) => p >= 0);

    results.push({ page, snippet, matchPositions });
  }

  // Sort by relevance: title matches first, then number of term occurrences
  results.sort((a, b) => {
    const aTitle = terms.some((t) => (a.page.title ?? '').toLowerCase().includes(t)) ? 1 : 0;
    const bTitle = terms.some((t) => (b.page.title ?? '').toLowerCase().includes(t)) ? 1 : 0;
    if (bTitle !== aTitle) return bTitle - aTitle;

    const aCount = terms.reduce(
      (sum, t) => sum + ((a.page.markdown_content ?? '').toLowerCase().split(t).length - 1),
      0
    );
    const bCount = terms.reduce(
      (sum, t) => sum + ((b.page.markdown_content ?? '').toLowerCase().split(t).length - 1),
      0
    );
    return bCount - aCount;
  });

  return results;
}

function generateSnippet(content: string, terms: string[]): string {
  if (!content) return '';
  const lower = content.toLowerCase();
  let bestIdx = -1;

  for (const t of terms) {
    const idx = lower.indexOf(t);
    if (idx >= 0) {
      bestIdx = idx;
      break;
    }
  }

  if (bestIdx < 0) bestIdx = 0;

  const start = Math.max(0, bestIdx - 60);
  const end = Math.min(content.length, bestIdx + 200);
  let snippet = content.slice(start, end).replace(/\n+/g, ' ').trim();
  if (start > 0) snippet = '…' + snippet;
  if (end < content.length) snippet += '…';

  return snippet;
}

// Saved searches (localStorage-backed for now)
export function getSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearch(query: string, category: string | null, competitorIds: string[]): SavedSearch {
  const searches = getSavedSearches();
  const newSearch: SavedSearch = {
    id: crypto.randomUUID(),
    query,
    category,
    competitor_ids: competitorIds,
    created_at: new Date().toISOString(),
  };
  searches.unshift(newSearch);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches.slice(0, 50)));
  return newSearch;
}

export function deleteSavedSearch(id: string): void {
  const searches = getSavedSearches().filter((s) => s.id !== id);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}
