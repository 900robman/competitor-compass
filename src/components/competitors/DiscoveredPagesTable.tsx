import { useState, useMemo } from 'react';
import { CompetitorPage } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { CategoryBadge } from './CategoryBadge';
import { ScrapeStatusBadge } from './ScrapeStatusBadge';
import { PageDetailDrawer } from './PageDetailDrawer';
import { ExternalLink, FileText, Search } from 'lucide-react';

interface DiscoveredPagesTableProps {
  pages: CompetitorPage[];
  isLoading: boolean;
}

export function DiscoveredPagesTable({ pages, isLoading }: DiscoveredPagesTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPage, setSelectedPage] = useState<CompetitorPage | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(pages.map((p) => (p.metadata as any)?.category ?? 'Uncategorized'));
    return Array.from(cats).sort();
  }, [pages]);

  const statuses = useMemo(() => {
    const s = new Set(pages.map((p) => p.scrape_status ?? 'unknown'));
    return Array.from(s).sort();
  }, [pages]);

  const filtered = useMemo(() => {
    return pages.filter((p) => {
      const matchesSearch =
        !search ||
        p.url.toLowerCase().includes(search.toLowerCase()) ||
        (p.title ?? '').toLowerCase().includes(search.toLowerCase());
      const cat = (p.metadata as any)?.category ?? 'Uncategorized';
      const matchesCat = categoryFilter === 'all' || cat === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (p.scrape_status ?? 'unknown') === statusFilter;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [pages, search, statusFilter, categoryFilter]);

  if (isLoading) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Discovered Pages ({pages.length})
      </h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Scrape Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((page) => {
                const category = (page.metadata as any)?.category ?? 'Uncategorized';
                let hostname = page.url;
                try {
                  const u = new URL(page.url.startsWith('http') ? page.url : `https://${page.url}`);
                  hostname = u.pathname === '/' ? u.hostname : u.hostname + u.pathname;
                } catch {}

                return (
                  <TableRow
                    key={page.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedPage(page)}
                  >
                    <TableCell>
                      <span className="flex items-center gap-1 text-primary max-w-[300px] truncate">
                        {hostname}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {page.title || '—'}
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={category} />
                    </TableCell>
                    <TableCell>
                      <ScrapeStatusBadge status={page.scrape_status} />
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
    </div>
  );
}
