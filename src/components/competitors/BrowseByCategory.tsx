import { useState, useMemo } from 'react';
import { CompetitorPage } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryBadge } from './CategoryBadge';
import { ScrapeStatusBadge } from './ScrapeStatusBadge';
import { PageDetailDrawer } from './PageDetailDrawer';
import { ExternalLink, FileText, Clock, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BrowseByCategoryProps {
  pages: CompetitorPage[];
}

function getCategory(page: CompetitorPage): string {
  return (page.metadata as any)?.category ?? 'Uncategorized';
}

export function BrowseByCategory({ pages }: BrowseByCategoryProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages.forEach((p) => {
      const cat = getCategory(p);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [pages]);

  const filteredPages = useMemo(() => {
    if (!activeCategory) return pages;
    return pages.filter((p) => getCategory(p) === activeCategory);
  }, [pages, activeCategory]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Browse by Category</h2>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 px-2', viewMode === 'grid' && 'bg-muted')}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 px-2', viewMode === 'list' && 'bg-muted')}
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <div className="w-48 shrink-0">
          <ScrollArea className="h-[500px]">
            <nav className="space-y-0.5 pr-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  activeCategory === null
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>All Pages</span>
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] justify-center px-1.5 text-xs">
                  {pages.length}
                </Badge>
              </button>
              {categoryCounts.map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeCategory === cat
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="truncate">{cat}</span>
                  <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] justify-center px-1.5 text-xs">
                    {count}
                  </Badge>
                </button>
              ))}
            </nav>
          </ScrollArea>
        </div>

        {/* Pages Content */}
        <div className="flex-1 min-w-0">
          {activeCategory && (
            <div className="mb-3 flex items-center gap-2">
              <CategoryBadge category={activeCategory} />
              <span className="text-sm text-muted-foreground">
                {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPages.map((page) => {
                const cat = getCategory(page);
                return (
                  <Card
                    key={page.id}
                    className="cursor-pointer border-border/50 transition-shadow hover:shadow-md"
                    onClick={() => setSelectedPage(page)}
                  >
                    {/* Thumbnail placeholder */}
                    <div className="flex h-24 items-center justify-center rounded-t-xl bg-muted/50">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <CardContent className="p-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {page.title || 'Untitled'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.url}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <CategoryBadge category={cat} />
                        <ScrapeStatusBadge status={page.scrape_status} />
                      </div>
                      {page.last_scraped_at && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(page.last_scraped_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPages.map((page) => {
                const cat = getCategory(page);
                return (
                  <Card
                    key={page.id}
                    className="cursor-pointer border-border/50 transition-shadow hover:shadow-md"
                    onClick={() => setSelectedPage(page)}
                  >
                    <CardContent className="flex items-center gap-4 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <FileText className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {page.title || 'Untitled'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{page.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={cat} />
                        <ScrapeStatusBadge status={page.scrape_status} />
                      </div>
                      {page.last_scraped_at && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(new Date(page.last_scraped_at), 'MMM d')}
                        </span>
                      )}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredPages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-8 w-8" />
              <p className="text-sm">No pages in this category</p>
            </div>
          )}
        </div>
      </div>

      <PageDetailDrawer
        page={selectedPage}
        open={!!selectedPage}
        onOpenChange={(open) => { if (!open) setSelectedPage(null); }}
      />
    </div>
  );
}
