import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllCrawlJobs } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { CrawlJob } from '@/types/database';
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import {
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Clock,
  Search,
  Activity,
} from 'lucide-react';

type CrawlJobWithName = CrawlJob & { competitor_name?: string };

const statusColors: Record<string, string> = {
  queued: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/15 text-warning',
  processing: 'bg-primary/15 text-primary',
  completed: 'bg-success/15 text-success',
  failed: 'bg-destructive/15 text-destructive',
};

const typeColors: Record<string, string> = {
  map: 'bg-primary/15 text-primary',
  scrape: 'bg-success/15 text-success',
  crawl: 'bg-accent text-accent-foreground',
};

function formatDuration(startedAt: string, completedAt: string | null): string {
  const end = completedAt ? new Date(completedAt) : new Date();
  const secs = differenceInSeconds(end, new Date(startedAt));
  if (secs < 60) return `${secs}s`;
  const mins = differenceInMinutes(end, new Date(startedAt));
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

function getProgress(job: CrawlJobWithName): { processed: number; total: number; pct: number } {
  const resultData = job.result_data as any;
  const total = resultData?.pages_discovered ?? resultData?.total ?? 0;
  const processed = resultData?.pages_processed ?? resultData?.processed ?? 0;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  return { processed, total, pct };
}

export default function CrawlJobsPage() {
  const queryClient = useQueryClient();
  const [competitorFilter, setCompetitorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retryDialogJob, setRetryDialogJob] = useState<CrawlJobWithName | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['allCrawlJobs'],
    queryFn: getAllCrawlJobs,
  });

  // Auto-refresh when there are active jobs
  const hasActiveJobs = jobs.some((j) => j.status === 'processing' || j.status === 'pending');

  useEffect(() => {
    if (!hasActiveJobs) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['allCrawlJobs'] });
    }, 5000);
    return () => clearInterval(interval);
  }, [hasActiveJobs, queryClient]);

  // Realtime subscription for job updates
  useEffect(() => {
    const channel = supabase
      .channel('crawl_jobs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crawl_jobs' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['allCrawlJobs'] });
          if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new as CrawlJob;
            if (newRecord.status === 'completed') {
              toast.success('Crawl job completed', {
                description: `Job ${newRecord.job_type} finished successfully.`,
              });
            } else if (newRecord.status === 'failed') {
              toast.error('Crawl job failed', {
                description: newRecord.error_message ?? 'Unknown error',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Derive filter options
  const competitors = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((j) => map.set(j.competitor_id, j.competitor_name ?? 'Unknown'));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [jobs]);

  const jobTypes = useMemo(() => Array.from(new Set(jobs.map((j) => j.job_type))).sort(), [jobs]);
  const statuses = useMemo(() => Array.from(new Set(jobs.map((j) => j.status))).sort(), [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (competitorFilter !== 'all' && j.competitor_id !== competitorFilter) return false;
      if (typeFilter !== 'all' && j.job_type !== typeFilter) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      return true;
    });
  }, [jobs, competitorFilter, typeFilter, statusFilter]);

  const failedJobs = useMemo(() => jobs.filter((j) => j.status === 'failed'), [jobs]);

  const handleRetry = async () => {
    if (!retryDialogJob) return;
    setRetryDialogJob(null);
    setIsRetrying(true);

    try {
      const webhookUrl =
        retryDialogJob.job_type === 'map'
          ? 'https://n8n.offshoot.co.nz/webhook/competitor/map?max_urls=100'
          : 'https://n8n.offshoot.co.nz/webhook/competitor/scrape-batch';

      const payload =
        retryDialogJob.job_type === 'map'
          ? {
              type: 'UPDATE',
              table: 'competitors',
              schema: 'public',
              record: { id: retryDialogJob.competitor_id },
              old_record: {},
            }
          : { competitor_id: retryDialogJob.competitor_id, page_ids: [] };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      toast.success('Job retry triggered');
      queryClient.invalidateQueries({ queryKey: ['allCrawlJobs'] });
    } catch (error) {
      toast.error('Failed to retry job', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const n8nBaseUrl = 'https://n8n.offshoot.co.nz/execution';

  return (
    <DashboardLayout>
      <Header
        title="Crawl Jobs"
        subtitle="Monitor and manage all crawl operations"
      />

      <div className="p-6">
        {/* Active indicator */}
        {hasActiveJobs && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-accent/50 px-4 py-2.5">
            <Activity className="h-4 w-4 animate-pulse text-primary" />
            <span className="text-sm font-medium text-foreground">
              Active jobs running — auto-refreshing every 5s
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={competitorFilter} onValueChange={setCompetitorFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <SelectValue placeholder="Competitor" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Companies</SelectItem>
              {competitors.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Types</SelectItem>
              {jobTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Failed Jobs Banner */}
        {failedJobs.length > 0 && statusFilter === 'all' && (
          <Card className="mb-4 border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {failedJobs.length} failed job{failedJobs.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-2 space-y-1.5">
                  {failedJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{job.competitor_name}</span>
                        {' — '}
                        {job.error_message?.slice(0, 80) ?? 'Unknown error'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setRetryDialogJob(job)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Retry
                      </Button>
                    </div>
                  ))}
                  {failedJobs.length > 3 && (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setStatusFilter('failed')}
                    >
                      View all {failedJobs.length} failed jobs
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Execution</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => {
                  const progress = getProgress(job);
                  const isActive = job.status === 'processing' || job.status === 'pending';
                  const isFailed = job.status === 'failed';
                  const n8nId = (job.result_data as any)?.n8n_execution_id ?? job.firecrawl_job_id;

                  return (
                    <TableRow
                      key={job.id}
                      className={isFailed ? 'bg-destructive/5' : undefined}
                    >
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[job.job_type] ?? 'bg-muted text-muted-foreground'}`}>
                          {job.job_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{job.competitor_name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[job.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {isActive && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {progress.total > 0 ? (
                          <div className="space-y-1">
                            <Progress value={progress.pct} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">
                              {progress.processed}/{progress.total}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(job.started_at), 'MMM d HH:mm')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isActive ? 'In progress' : formatDuration(job.started_at, job.completed_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {n8nId ? (
                          <a
                            href={`${n8nBaseUrl}/${n8nId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            {String(n8nId).slice(0, 8)}…
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isFailed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setRetryDialogJob(job)}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Retry
                          </Button>
                        )}
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
              <div className="rounded-full bg-muted p-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No crawl jobs found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Jobs will appear here when you trigger a crawl or scrape.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Retry Confirmation */}
      <AlertDialog open={!!retryDialogJob} onOpenChange={(o) => { if (!o) setRetryDialogJob(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry failed job?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will re-trigger a <strong>{retryDialogJob?.job_type}</strong> job for{' '}
                <strong>{retryDialogJob?.competitor_name}</strong>.
              </span>
              {retryDialogJob?.error_message && (
                <span className="block rounded bg-destructive/10 p-2 text-xs text-destructive">
                  Previous error: {retryDialogJob.error_message}
                </span>
              )}
              <span className="block text-xs text-muted-foreground">
                ⏱ This will use Firecrawl credits based on the job type.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
