import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryBadge } from '@/components/competitors/CategoryBadge';
import { ScrapeStatusBadge } from '@/components/competitors/ScrapeStatusBadge';
import { PageDetailDrawer } from '@/components/competitors/PageDetailDrawer';
import { useQuery } from '@tanstack/react-query';
import { getProjects, getCompetitors } from '@/lib/api';
import {
  searchContent,
  SearchResult,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  SavedSearch,
} from '@/lib/search';
import { CompetitorPage } from '@/types/database';
import {
  Search,
  Loader2,
  Bookmark,
  BookmarkPlus,
  Trash2,
  ExternalLink,
  FileText,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (!text || terms.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        terms.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <mark key={i} className="rounded bg-warning/30 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [competitorFilter, setCompetitorFilter] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(getSavedSearches);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  // Gather all competitors across projects
  const allCompetitorQueries = projects.map((p) => p.id);
  const { data: allCompetitors = [] } = useQuery({
    queryKey: ['allCompetitorsForSearch'],
    queryFn: async () => {
      const results = await Promise.all(allCompetitorQueries.map((pid) => getCompetitors(pid)));
      return results.flat();
    },
    enabled: projects.length > 0,
  });

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['search', submittedQuery, categoryFilter, competitorFilter],
    queryFn: () =>
      searchContent(submittedQuery, {
        competitorIds: competitorFilter.length > 0 ? competitorFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      }),
    enabled: submittedQuery.length > 0,
  });

  const terms = useMemo(() => submittedQuery.toLowerCase().split(/\s+/).filter(Boolean), [submittedQuery]);

  // Derive categories from results
  const resultCategories = useMemo(() => {
    const cats = new Set(results.map((r) => (r.page.metadata as any)?.category ?? 'Uncategorized'));
    return Array.from(cats).sort();
  }, [results]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmittedQuery(query.trim());
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  const handleSaveSearch = () => {
    if (!submittedQuery) return;
    const saved = saveSearch(
      submittedQuery,
      categoryFilter !== 'all' ? categoryFilter : null,
      competitorFilter
    );
    setSavedSearches(getSavedSearches());
    toast.success('Search saved', { description: `Watching for "${submittedQuery}"` });
  };

  const handleDeleteSaved = (id: string) => {
    deleteSavedSearch(id);
    setSavedSearches(getSavedSearches());
    toast.success('Saved search removed');
  };

  const handleLoadSaved = (s: SavedSearch) => {
    setQuery(s.query);
    setSubmittedQuery(s.query);
    setCategoryFilter(s.category ?? 'all');
    setCompetitorFilter(s.competitor_ids);
    setSearchParams({ q: s.query });
  };

  const isSearchSaved = savedSearches.some((s) => s.query === submittedQuery);

  return (
    <DashboardLayout>
      <Header title="Search" subtitle="Search across all scraped company content" />

      <div className="p-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search titles, content, URLs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 pl-10 text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={!query.trim()}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </form>

        <div className="flex gap-6">
          {/* Sidebar: Filters + Saved Searches */}
          <div className="w-56 shrink-0 space-y-6">
            {/* Filters */}
            {submittedQuery && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </h3>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="all">All Categories</SelectItem>
                      {resultCategories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                   Companies
                  </h3>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-1">
                      {allCompetitors.map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={competitorFilter.includes(c.id)}
                            onCheckedChange={(checked) => {
                              setCompetitorFilter((prev) =>
                                checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                              );
                            }}
                            className="h-3.5 w-3.5"
                          />
                          <span className="truncate text-foreground">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Save search button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSaveSearch}
                  disabled={isSearchSaved}
                >
                  {isSearchSaved ? (
                    <Bookmark className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  ) : (
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isSearchSaved ? 'Search Saved' : 'Watch This Search'}
                </Button>
              </div>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saved Searches
                </h3>
                <div className="space-y-1">
                  {savedSearches.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted"
                    >
                      <button
                        className="flex-1 text-left text-sm text-foreground truncate"
                        onClick={() => handleLoadSaved(s)}
                      >
                        <span className="flex items-center gap-1.5">
                          <Bookmark className="h-3 w-3 shrink-0 text-primary" />
                          {s.query}
                        </span>
                      </button>
                      <button
                        className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteSaved(s.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : submittedQuery ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{submittedQuery}"
                </p>

                {results.length > 0 ? (
                  <div className="space-y-3">
                    {results.map((result) => {
                      const category = (result.page.metadata as any)?.category ?? 'Uncategorized';
                      return (
                        <Card
                          key={result.page.id}
                          className="cursor-pointer border-border/50 transition-shadow hover:shadow-md"
                          onClick={() => setSelectedPage(result.page)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground">
                                  <HighlightedText text={result.page.title || 'Untitled'} terms={terms} />
                                </p>
                                <p className="mt-0.5 truncate text-xs text-primary">
                                  {result.page.url}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                  <HighlightedText text={result.snippet} terms={terms} />
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {result.page.competitor_name}
                              </Badge>
                              <CategoryBadge category={category} />
                              <ScrapeStatusBadge status={result.page.scrape_status} />
                              {result.page.last_scraped_at && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(result.page.last_scraped_at), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="mb-2 h-8 w-8" />
                    <p className="text-sm">No results found for "{submittedQuery}"</p>
                    <p className="mt-1 text-xs">Try different keywords or adjust filters</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="mb-2 h-8 w-8" />
                <p className="text-sm">Enter a search term to find content across all tracked companies</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PageDetailDrawer
        page={selectedPage}
        open={!!selectedPage}
        onOpenChange={(open) => { if (!open) setSelectedPage(null); }}
      />
    </DashboardLayout>
  );
}
