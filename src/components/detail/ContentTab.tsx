import { useState, useMemo, useCallback } from 'react';
import { CompetitorPage } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryBadge } from '@/components/competitors/CategoryBadge';
import { ScrapeStatusBadge } from '@/components/competitors/ScrapeStatusBadge';
import { PageDetailDrawer } from '@/components/competitors/PageDetailDrawer';
import { Search, FileText, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePageCategories } from '@/hooks/usePageCategories';

interface ContentTabProps {
  pages: CompetitorPage[];
  isLoading: boolean;
}

function getCategory(page: CompetitorPage): string {
  return page.category ?? (page.metadata as any)?.category ?? 'Uncategorized';
}

export function ContentTab({ pages, isLoading }: ContentTabProps) {
  const queryClient = useQueryClient();
  const { data: dbCategories = [] } = usePageCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);
  const [isBulkPending, setIsBulkPending] = useState(false);

  // Derive categories with counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages.forEach((p) => {
      const cat = getCategory(p);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [pages]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pages.filter((p) => {
      const matchesSearch =
        !q ||
        p.url.toLowerCase().includes(q) ||
        (p.title ?? '').toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || getCategory(p) === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [pages, search, categoryFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  const toggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  }, [filtered, allFilteredSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMarkPending = async () => {
    const ids = Array.from(selectedIds);
    const competitorId = pages[0]?.competitor_id;
    setIsBulkPending(true);
    try {
      const { error } = await supabase
        .from('competitor_pages')
        .update({ scrape_status: 'pending' })
        .in('id', ids);
      if (error) throw error;
      toast.success(`Marked ${ids.length} pages as pending`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['competitorPages', competitorId] });
    } catch (error) {
      toast.error('Failed to mark pages as pending');
    } finally {
      setIsBulkPending(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[220px] text-sm">
            <SelectValue placeholder="Category: All" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All ({pages.length})</SelectItem>
            {categoryCounts.map(([cat, count]) => (
              <SelectItem key={cat} value={cat}>
                {cat} ({count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-accent/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8"
            onClick={handleBulkMarkPending}
            disabled={isBulkPending}
          >
            {isBulkPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Clock className="mr-1.5 h-3.5 w-3.5" />
            )}
            Mark as Pending
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 ? (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleAll}
                    className="h-3.5 w-3.5"
                  />
                </TableHead>
                <TableHead>Page Title / URL</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Scrape Status</TableHead>
                <TableHead>Last Scraped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((page) => {
                const category = getCategory(page);
                let displayPath = page.url;
                try {
                  const u = new URL(page.url.startsWith('http') ? page.url : `https://${page.url}`);
                  displayPath = u.pathname === '/' ? '/' : u.pathname;
                } catch {}

                return (
                  <TableRow
                    key={page.id}
                    className="cursor-pointer"
                    data-state={selectedIds.has(page.id) ? 'selected' : undefined}
                    onClick={() => setSelectedPage(page)}
                  >
                    <TableCell onClick={(e) => { e.stopPropagation(); toggleOne(page.id); }}>
                      <Checkbox checked={selectedIds.has(page.id)} className="h-3.5 w-3.5" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground truncate max-w-[300px]">
                          {page.title || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {displayPath}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={category}
                        onValueChange={async (newCat) => {
                          const { error } = await supabase
                            .from('competitor_pages')
                            .update({ category: newCat === 'Uncategorized' ? null : newCat })
                            .eq('id', page.id);
                          if (error) {
                            toast.error('Failed to update category');
                          } else {
                            queryClient.invalidateQueries({ queryKey: ['competitorPages', page.competitor_id] });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 w-[140px] text-xs border-none bg-transparent hover:bg-accent/50 p-1">
                          <CategoryBadge category={category} color={dbCategories.find(c => c.name === category)?.color} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {dbCategories.filter(c => c.is_active).map((cat) => (
                            <SelectItem key={cat.name} value={cat.name}>
                              <CategoryBadge category={cat.name} color={cat.color} />
                            </SelectItem>
                          ))}
                          <SelectItem value="Uncategorized">
                            <CategoryBadge category="Uncategorized" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <ScrapeStatusBadge status={page.scrape_status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {page.last_scraped_at
                        ? format(new Date(page.last_scraped_at), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {pages.length === 0 ? 'No pages discovered yet' : 'No pages match your filters'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Drawer */}
      <PageDetailDrawer
        page={selectedPage}
        open={!!selectedPage}
        onOpenChange={(open) => { if (!open) setSelectedPage(null); }}
      />
    </div>
  );
}
