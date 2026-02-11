import { useState, useMemo, useCallback, useRef } from 'react';
import { CompetitorPage } from '@/types/database';
import { Card } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryBadge } from './CategoryBadge';
import { ScrapeStatusBadge } from './ScrapeStatusBadge';
import { MultiSelectFilter } from './MultiSelectFilter';
import { PageDetailDrawer } from './PageDetailDrawer';
import {
  ExternalLink,
  FileText,
  Search,
  ArrowUpDown,
  Star,
  Trash2,
  Loader2,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePageCategories } from '@/hooks/usePageCategories';

type SortField = 'last_scraped_at' | 'url' | 'category' | 'created_at';
type SortDir = 'asc' | 'desc';

interface DiscoveredPagesTableProps {
  pages: CompetitorPage[];
  isLoading: boolean;
}

function getCategory(page: CompetitorPage): string {
  return (page.metadata as any)?.category ?? 'Uncategorized';
}

export function DiscoveredPagesTable({ pages, isLoading }: DiscoveredPagesTableProps) {
  const queryClient = useQueryClient();
  const { data: dbCategories = [] } = usePageCategories();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);

  // Bulk action states
  const [isBulkScraping, setIsBulkScraping] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Derive unique filter options
  const categories = useMemo(() => {
    return Array.from(new Set(pages.map(getCategory))).sort();
  }, [pages]);

  const scrapeStatuses = useMemo(() => {
    return Array.from(new Set(pages.map((p) => p.scrape_status ?? 'unknown'))).sort();
  }, [pages]);

  // Filter + search + sort
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = pages.filter((p) => {
      // Text search across url, title, and markdown_content
      const matchesSearch =
        !q ||
        p.url.toLowerCase().includes(q) ||
        (p.title ?? '').toLowerCase().includes(q) ||
        (p.markdown_content ?? '').toLowerCase().includes(q);

      const cat = getCategory(p);
      const matchesCat = categoryFilter.size === 0 || categoryFilter.has(cat);
      const matchesStatus =
        statusFilter.size === 0 || statusFilter.has(p.scrape_status ?? 'unknown');

      return matchesSearch && matchesCat && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'url':
          cmp = a.url.localeCompare(b.url);
          break;
        case 'category':
          cmp = getCategory(a).localeCompare(getCategory(b));
          break;
        case 'last_scraped_at':
          cmp =
            new Date(a.last_scraped_at ?? '1970-01-01').getTime() -
            new Date(b.last_scraped_at ?? '1970-01-01').getTime();
          break;
        case 'created_at':
        default:
          cmp =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [pages, search, categoryFilter, statusFilter, sortField, sortDir]);

  // Selection helpers
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

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

  // Bulk mark pending
  const handleBulkMarkPending = async () => {
    const ids = Array.from(selectedIds);
    const competitorId = pages[0]?.competitor_id;
    setIsBulkScraping(true);
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
      toast.error('Failed to mark pages as pending', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsBulkScraping(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    setBulkDeleteOpen(false);
    const ids = Array.from(selectedIds);
    const competitorId = pages[0]?.competitor_id;
    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('competitor_pages')
        .delete()
        .in('id', ids);
      if (error) throw error;
      toast.success(`Deleted ${ids.length} pages`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['competitorPages', competitorId] });
    } catch (error) {
      toast.error('Failed to delete pages', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const hasActiveFilters = categoryFilter.size > 0 || statusFilter.size > 0 || search.length > 0;

  if (isLoading) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Discovered Pages ({pages.length})
      </h2>

      {/* Search + Filters Row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search URL, title, or content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        <MultiSelectFilter
          label="Categories"
          options={categories}
          selected={categoryFilter}
          onChange={setCategoryFilter}
        />

        <MultiSelectFilter
          label="Statuses"
          options={scrapeStatuses}
          selected={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Sort */}
        <Select
          value={`${sortField}:${sortDir}`}
          onValueChange={(v) => {
            const [field, dir] = v.split(':') as [SortField, SortDir];
            setSortField(field);
            setSortDir(dir);
          }}
        >
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="created_at:desc">Newest first</SelectItem>
            <SelectItem value="created_at:asc">Oldest first</SelectItem>
            <SelectItem value="last_scraped_at:desc">Last scraped ↓</SelectItem>
            <SelectItem value="last_scraped_at:asc">Last scraped ↑</SelectItem>
            <SelectItem value="url:asc">URL A–Z</SelectItem>
            <SelectItem value="url:desc">URL Z–A</SelectItem>
            <SelectItem value="category:asc">Category A–Z</SelectItem>
            <SelectItem value="category:desc">Category Z–A</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setSearch('');
              setCategoryFilter(new Set());
              setStatusFilter(new Set());
            }}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-accent/50 px-4 py-2">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleBulkMarkPending}
              disabled={isBulkScraping}
            >
              {isBulkScraping ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Clock className="mr-1.5 h-3.5 w-3.5" />
              )}
              Mark Pending
            </Button>
            <Button variant="outline" size="sm" className="h-8" disabled>
              <Star className="mr-1.5 h-3.5 w-3.5" />
              Mark Priority
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:bg-destructive/10"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      {hasActiveFilters && filtered.length !== pages.length && (
        <p className="mb-2 text-xs text-muted-foreground">
          Showing {filtered.length} of {pages.length} pages
        </p>
      )}

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
                <TableHead>URL</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Scrape Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((page) => {
                const category = getCategory(page);
                let hostname = page.url;
                try {
                  const u = new URL(
                    page.url.startsWith('http') ? page.url : `https://${page.url}`
                  );
                  hostname =
                    u.pathname === '/' ? u.hostname : u.hostname + u.pathname;
                } catch {}

                return (
                  <TableRow
                    key={page.id}
                    className="cursor-pointer"
                    data-state={selectedIds.has(page.id) ? 'selected' : undefined}
                    onClick={() => setSelectedPage(page)}
                  >
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(page.id);
                      }}
                    >
                      <Checkbox
                        checked={selectedIds.has(page.id)}
                        className="h-3.5 w-3.5"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-primary max-w-[300px] truncate">
                        {hostname}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {page.title || '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={category}
                        onValueChange={async (newCat) => {
                          const currentMeta = (page.metadata as any) ?? {};
                          const { error } = await supabase
                            .from('competitor_pages')
                            .update({ metadata: { ...currentMeta, category: newCat } })
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const currentStatus = page.scrape_status ?? 'not_scraped';
                        const isEditable = currentStatus === 'not_scraped' || currentStatus === 'pending';
                        if (!isEditable) {
                          return <ScrapeStatusBadge status={currentStatus} />;
                        }
                        const allowedStatuses = currentStatus === 'pending' ? ['not_scraped', 'pending'] : ['not_scraped', 'pending'];
                        return (
                          <Select
                            value={currentStatus}
                            onValueChange={async (newStatus) => {
                              const { error } = await supabase
                                .from('competitor_pages')
                                .update({ scrape_status: newStatus })
                                .eq('id', page.id);
                              if (error) {
                                toast.error('Failed to update scrape status');
                              } else {
                                queryClient.invalidateQueries({ queryKey: ['competitorPages', page.competitor_id] });
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs border-none bg-transparent hover:bg-accent/50 p-1">
                              <ScrapeStatusBadge status={currentStatus} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {allowedStatuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  <ScrapeStatusBadge status={s} />
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              {pages.length === 0 ? 'No pages discovered yet' : 'No pages match filters'}
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {pages.length === 0
                ? 'Pages will appear here after crawling.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        </Card>
      )}

      {/* Page Detail Drawer */}
      <PageDetailDrawer
        page={selectedPage}
        open={!!selectedPage}
        onOpenChange={(open) => {
          if (!open) setSelectedPage(null);
        }}
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} pages?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently delete <strong>{selectedIds.size}</strong> page
                {selectedIds.size !== 1 ? 's' : ''} and all associated scraped content.
              </span>
              <span className="block text-xs text-muted-foreground">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedIds.size} Pages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
