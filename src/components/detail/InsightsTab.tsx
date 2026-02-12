import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface InsightsTabProps {
  competitorName: string;
}

export function InsightsTab({ competitorName }: InsightsTabProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary/10 p-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">AI-Powered Insights</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
          AI analysis and insights for {competitorName} will be available here soon.
          This will include competitive analysis, content summaries, and strategic recommendations.
        </p>
      </CardContent>
    </Card>
  );
}
