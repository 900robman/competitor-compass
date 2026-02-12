import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryBadge } from '@/components/competitors/CategoryBadge';
import { ScrapeStatusBadge } from '@/components/competitors/ScrapeStatusBadge';
import { PageDetailDrawer } from '@/components/competitors/PageDetailDrawer';
import { useProject } from '@/hooks/useProjects';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useQuery } from '@tanstack/react-query';
import { getProjectPages } from '@/lib/api';
import { CompetitorPage } from '@/types/database';
import { format } from 'date-fns';
import { FileText, Loader2, Columns, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageWithName = CompetitorPage & { competitor_name?: string };

function getCategory(page: CompetitorPage): string {
  return (page.metadata as any)?.category ?? 'Uncategorized';
}

export default function CompareCategoriesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const { data: competitors = [] } = useCompetitors(projectId!);
  const { data: allPages = [], isLoading } = useQuery({
    queryKey: ['projectPages', projectId],
    queryFn: () => getProjectPages(projectId!),
    enabled: !!projectId,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedCompetitors, setSelectedCompetitors] = useState<Set<string>>(new Set());
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);

  // Derive categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPages.forEach((p) => {
      const cat = getCategory(p);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allPages]);

  // Filter pages
  const filteredPages = useMemo(() => {
    return allPages.filter((p) => {
      if (activeCategory && getCategory(p) !== activeCategory) return false;
      if (selectedCompetitors.size > 0 && !selectedCompetitors.has(p.competitor_id)) return false;
      return true;
    });
  }, [allPages, activeCategory, selectedCompetitors]);

  // Group by competitor for side-by-side
  const groupedByCompetitor = useMemo(() => {
    const groups: Record<string, { name: string; pages: PageWithName[] }> = {};
    filteredPages.forEach((p) => {
      if (!groups[p.competitor_id]) {
        groups[p.competitor_id] = { name: p.competitor_name ?? 'Unknown', pages: [] };
      }
      groups[p.competitor_id].pages.push(p);
    });
    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filteredPages]);

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout projectName={project?.name}>
      <Header
        title="Compare by Category"
        subtitle={`Side-by-side comparison across ${competitors.length} tracked companies`}
      />

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left sidebar: categories + competitor filter */}
            <div className="w-52 shrink-0 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h3>
                <ScrollArea className="h-[300px]">
                  <nav className="space-y-0.5 pr-2">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        !activeCategory
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span>All</span>
                      <Badge variant="secondary" className="h-5 min-w-[20px] justify-center px-1.5 text-xs">
                        {allPages.length}
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

              {/* Competitor filter */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Companies
                </h3>
                <div className="space-y-1">
                  {competitors.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedCompetitors.size === 0 || selectedCompetitors.has(c.id)}
                        onCheckedChange={() => toggleCompetitor(c.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate text-foreground">{c.name}</span>
                    </label>
                  ))}
                </div>
                {selectedCompetitors.size > 0 && (
                  <button
                    className="mt-1 px-3 text-xs text-primary hover:underline"
                    onClick={() => setSelectedCompetitors(new Set())}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>

            {/* Main content: side-by-side columns */}
            <div className="flex-1 min-w-0">
              {activeCategory && (
                <div className="mb-4 flex items-center gap-2">
                  <CategoryBadge category={activeCategory} />
                  <span className="text-sm text-muted-foreground">
                    {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''} across{' '}
                    {groupedByCompetitor.length} compan{groupedByCompetitor.length !== 1 ? 'ies' : 'y'}
                  </span>
                </div>
              )}

              {groupedByCompetitor.length > 0 ? (
                <div className={cn(
                  'grid gap-4',
                  groupedByCompetitor.length === 1 ? 'grid-cols-1' :
                  groupedByCompetitor.length === 2 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                )}>
                  {groupedByCompetitor.map(([compId, { name, pages: compPages }]) => (
                    <Card key={compId} className="border-border/50">
                      <div className="border-b border-border px-4 py-3">
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {compPages.length} page{compPages.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-1 p-2">
                          {compPages.map((page) => (
                            <div
                              key={page.id}
                              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-muted/50"
                              onClick={() => setSelectedPage(page)}
                            >
                              <p className="truncate text-sm font-medium text-foreground">
                                {page.title || 'Untitled'}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.url}</p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <ScrapeStatusBadge status={page.scrape_status} />
                                {page.last_scraped_at && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(page.last_scraped_at), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Columns className="mb-2 h-8 w-8" />
                  <p className="text-sm">No pages match the current filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <PageDetailDrawer
        page={selectedPage}
        open={!!selectedPage}
        onOpenChange={(open) => { if (!open) setSelectedPage(null); }}
      />
    </DashboardLayout>
  );
}
