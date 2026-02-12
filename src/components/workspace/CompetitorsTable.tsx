import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CompanyTypeBadge } from '@/components/competitors/CompanyTypeBadge';
import { PriorityBadge } from '@/components/competitors/PriorityBadge';
import { StatusBadge } from '@/components/competitors/StatusBadge';
import { ExternalLink, Trash2, Info, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Competitor } from '@/types/database';

interface CompetitorsTableProps {
  competitors: Competitor[];
  projectId: string;
  onDelete: (id: string) => void;
}

export function CompetitorsTable({ competitors, projectId, onDelete }: CompetitorsTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TooltipProvider>
          {competitors.map((competitor) => (
            <TableRow
              key={competitor.id}
              className="cursor-pointer"
              onClick={() => navigate(`/project/${projectId}/competitor/${competitor.id}`)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-1.5">
                  {competitor.name}
                  {competitor.relationship_notes && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">{competitor.relationship_notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {competitor.main_url ? (
                  <a
                    href={competitor.main_url.startsWith('http') ? competitor.main_url : `https://${competitor.main_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {(() => {
                      try {
                        return new URL(competitor.main_url.startsWith('http') ? competitor.main_url : `https://${competitor.main_url}`).hostname;
                      } catch {
                        return competitor.main_url;
                      }
                    })()}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">No URL</span>
                )}
              </TableCell>
              <TableCell>
                <CompanyTypeBadge type={competitor.company_type} />
              </TableCell>
              <TableCell>
                <StatusBadge status={competitor.last_crawled_at ? 'Active' : 'Pending'} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={competitor.monitoring_priority} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => navigate(`/project/${projectId}/competitor/${competitor.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(competitor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TooltipProvider>
      </TableBody>
    </Table>
  );
}
