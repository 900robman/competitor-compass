import { CrawlJob } from '@/types/database';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { ScrapeStatusBadge } from './ScrapeStatusBadge';
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { History } from 'lucide-react';

interface CrawlHistoryTableProps {
  jobs: CrawlJob[];
  isLoading: boolean;
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'In progress…';
  const secs = differenceInSeconds(new Date(completedAt), new Date(startedAt));
  if (secs < 60) return `${secs}s`;
  const mins = differenceInMinutes(new Date(completedAt), new Date(startedAt));
  const remainingSecs = secs % 60;
  return `${mins}m ${remainingSecs}s`;
}

function jobStatusToLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    running: 'Active',
    completed: 'Active',
    failed: 'Error',
  };
  return map[status] ?? status;
}

export function CrawlHistoryTable({ jobs, isLoading }: CrawlHistoryTableProps) {
  if (isLoading) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-semibold text-foreground">
        Crawl History ({jobs.length})
      </h2>

      {jobs.length > 0 ? (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium capitalize">{job.job_type}</TableCell>
                  <TableCell>
                    <ScrapeStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(job.started_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(job.started_at, job.completed_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.completed_at
                      ? format(new Date(job.completed_at), 'MMM d, yyyy HH:mm')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">No crawl history</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crawl jobs will appear here once triggered.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
