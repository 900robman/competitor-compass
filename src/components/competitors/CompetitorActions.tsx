import { useState } from 'react';
import { Competitor, CompetitorPage } from '@/types/database';
import { Button } from '@/components/ui/button';
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
import { Loader2, Map, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorActionsProps {
  competitor: Competitor;
  pages: CompetitorPage[];
}

export function CompetitorActions({ competitor, pages }: CompetitorActionsProps) {
  const queryClient = useQueryClient();
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const hasBeenMapped = pages.length > 0 || !!competitor.last_crawled_at;
  const pendingPages = pages.filter((p) => p.scrape_status === 'pending');

  const handleReMap = async () => {
    setMapDialogOpen(false);
    setIsMapping(true);
    try {
      const payload = {
        type: 'UPDATE',
        table: 'competitors',
        schema: 'public',
        record: {
          id: competitor.id,
          project_id: competitor.project_id,
          name: competitor.name,
          main_url: competitor.main_url,
        },
        old_record: {},
      };

      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          action: 'map',
          payload,
          query_params: { max_urls: '100' },
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      toast.success('Site mapping triggered', {
        description: 'Pages will appear shortly as the crawl completes.',
      });

      // Refresh data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['competitorPages', competitor.id] });
        queryClient.invalidateQueries({ queryKey: ['crawlJobs', competitor.id] });
        queryClient.invalidateQueries({ queryKey: ['competitor', competitor.id] });
      }, 3000);
    } catch (error) {
      toast.error('Failed to trigger site mapping', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsMapping(false);
    }
  };

  const handleScrapePending = async () => {
    setScrapeDialogOpen(false);
    setIsScraping(true);
    try {
      const payload = {
        competitor_id: competitor.id,
        page_ids: pendingPages.map((p) => p.id),
      };

      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: {
          action: 'scrape-batch',
          payload,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      toast.success(`Scraping ${pendingPages.length} pages`, {
        description: 'Content will be available once scraping completes.',
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['competitorPages', competitor.id] });
        queryClient.invalidateQueries({ queryKey: ['crawlJobs', competitor.id] });
      }, 3000);
    } catch (error) {
      toast.error('Failed to trigger batch scrape', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setMapDialogOpen(true)}
          disabled={isMapping}
        >
          {isMapping ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Map className="mr-2 h-4 w-4" />
          )}
          {hasBeenMapped ? 'Re-map Site' : 'Map Site'}
        </Button>

        <Button
          onClick={() => setScrapeDialogOpen(true)}
          disabled={isScraping || pendingPages.length === 0}
        >
          {isScraping ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Scrape Pending Pages
          {pendingPages.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
              {pendingPages.length}
            </span>
          )}
        </Button>
      </div>

      {/* Re-map Confirmation */}
      <AlertDialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{hasBeenMapped ? 'Re-map' : 'Map'} Site?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will trigger a Firecrawl map of <strong>{competitor.main_url}</strong> to
                discover up to 100 URLs.
              </span>
              <span className="block text-xs text-muted-foreground">
                ⏱ Estimated time: ~30 seconds — 1 Firecrawl credit
              </span>
              <span className="block text-xs text-muted-foreground">
                Existing pages will not be removed. New URLs will be added with status "pending".
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReMap}>
              <Map className="mr-2 h-4 w-4" />
              Start Mapping
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scrape Confirmation */}
      <AlertDialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scrape Pending Pages?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will scrape <strong>{pendingPages.length}</strong> pending page{pendingPages.length !== 1 ? 's' : ''} and
                extract their content.
              </span>
              <span className="block text-xs text-muted-foreground">
                ⏱ Estimated time: ~{Math.max(1, Math.ceil(pendingPages.length * 0.5))} minutes — {pendingPages.length} Firecrawl credit{pendingPages.length !== 1 ? 's' : ''}
              </span>
              <span className="block text-xs text-muted-foreground">
                Each page will be scraped for markdown content and metadata.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleScrapePending}>
              <FileDown className="mr-2 h-4 w-4" />
              Start Scraping ({pendingPages.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
