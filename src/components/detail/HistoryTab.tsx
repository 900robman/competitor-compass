import { useState, useMemo } from 'react';
import { CrawlJob } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
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
import { ScrapeStatusBadge } from '@/components/competitors/ScrapeStatusBadge';
import { History } from 'lucide-react';
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';

interface HistoryTabProps {
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

export function HistoryTab({ jobs, isLoading }: HistoryTabProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesType = typeFilter === 'all' || job.job_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesType && matchesStatus;
    });
  }, [jobs, typeFilter, statusFilter]);

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Type: All" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="map">Map</SelectItem>
            <SelectItem value="scrape">Scrape</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(job.started_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium capitalize">{job.job_type}</TableCell>
                  <TableCell>
                    <ScrapeStatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(job.started_at, job.completed_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {jobs.length === 0 ? 'No crawl history yet' : 'No jobs match your filters'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
