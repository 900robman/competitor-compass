import { useState } from 'react';
import { CompetitorPage } from '@/types/database';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryBadge } from './CategoryBadge';
import { ScrapeStatusBadge } from './ScrapeStatusBadge';
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
import {
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Archive,
  Loader2,
  Clock,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';

interface PageDetailDrawerProps {
  page: CompetitorPage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function CodeBlock({ content, label }: { content: string | null; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="mb-2 h-8 w-8" />
        <p className="text-sm">No {label.toLowerCase()} available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 z-10 h-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/50 p-4">
        <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono">
          {content}
        </pre>
      </ScrollArea>
    </div>
  );
}

function MetadataTree({ data }: { data: any }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="mb-2 h-8 w-8" />
        <p className="text-sm">No metadata available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/50 p-4">
      <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </ScrollArea>
  );
}

export function PageDetailDrawer({ page, open, onOpenChange }: PageDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  if (!page) return null;

  const category = (page.metadata as any)?.category ?? 'Uncategorized';
  const wordCount = countWords(page.markdown_content);
  const fullUrl = page.url.startsWith('http') ? page.url : `https://${page.url}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(page.url);
    setUrlCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleReScrape = async () => {
    setScrapeDialogOpen(false);
    setIsScraping(true);
    try {
      const res = await fetch(
        'https://n8n.offshoot.co.nz/webhook/competitor/scrape-batch',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitor_id: page.competitor_id,
            page_ids: [page.id],
          }),
        }
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      toast.success('Page scrape triggered', {
        description: 'Content will update once scraping completes.',
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['competitorPages', page.competitor_id] });
      }, 3000);
    } catch (error) {
      toast.error('Failed to trigger scrape', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg leading-tight pr-8">
              {page.title || 'Untitled Page'}
            </SheetTitle>
          </SheetHeader>

          {/* Metadata Section */}
          <div className="space-y-4 pb-6">
            {/* URL */}
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline break-all"
            >
              {page.url}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={category} />
              <ScrapeStatusBadge status={page.scrape_status} />
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {page.last_scraped_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Scraped {format(new Date(page.last_scraped_at), "MMM d, yyyy 'at' HH:mm")}
                </span>
              )}
              {wordCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {wordCount.toLocaleString()} words
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScrapeDialogOpen(true)}
                disabled={isScraping}
              >
                {isScraping ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Re-scrape
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                {urlCopied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {urlCopied ? 'Copied' : 'Copy URL'}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open Original
                </a>
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                View in Archive
              </Button>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="rendered" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="rendered">Rendered</TabsTrigger>
              <TabsTrigger value="raw">Raw MD</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="rendered" className="mt-4">
              {page.markdown_content ? (
                <ScrollArea className="h-[400px] rounded-lg border border-border bg-card p-6">
                  <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-code:text-accent-foreground prose-code:bg-accent prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs">
                    <ReactMarkdown>{page.markdown_content}</ReactMarkdown>
                  </article>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="mb-2 h-8 w-8" />
                  <p className="text-sm">No rendered content available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <CodeBlock content={page.markdown_content} label="Markdown" />
            </TabsContent>

            <TabsContent value="html" className="mt-4">
              <CodeBlock content={page.html_content} label="HTML source" />
            </TabsContent>

            <TabsContent value="metadata" className="mt-4">
              <MetadataTree data={page.metadata} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Re-scrape Confirmation */}
      <AlertDialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-scrape this page?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will scrape <strong className="break-all">{page.url}</strong> and update its
                content.
              </span>
              <span className="block text-xs text-muted-foreground">
                ⏱ Estimated time: ~15 seconds — 1 Firecrawl credit
              </span>
              <span className="block text-xs text-muted-foreground">
                Existing content will be replaced with the latest version.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReScrape}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-scrape Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
