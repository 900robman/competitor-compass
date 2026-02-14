import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useInterviewSessions,
  useCreateInterviewSession,
  useInterviewMessages,
  useClientResponses,
} from '@/hooks/useInterviews';
import { toast } from 'sonner';
import {
  Plus,
  Copy,
  MessageSquare,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  ArrowLeft,
  User,
  Bot,
  Sparkles,
} from 'lucide-react';
import type { InterviewSession } from '@/types/interview';
import ReactMarkdown from 'react-markdown';

interface ClientInterviewTabProps {
  projectId: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  active: { label: 'Active', variant: 'default', icon: Clock },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle },
  expired: { label: 'Expired', variant: 'outline', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

export function ClientInterviewTab({ projectId }: ClientInterviewTabProps) {
  const { data: sessions = [], isLoading } = useInterviewSessions(projectId);
  const createSession = useCreateInterviewSession();
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const handleCreate = async () => {
    try {
      await createSession.mutateAsync(projectId);
      toast.success('Interview session created');
    } catch {
      toast.error('Failed to create session');
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Interview link copied to clipboard');
  };

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Client Interviews</h2>
          <p className="text-sm text-muted-foreground">
            Create interview sessions and share links with clients for AI-powered discovery calls.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={createSession.isPending}>
          {createSession.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Start New Interview
        </Button>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">No interviews yet</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Start a new interview session and share the link with your client. The AI will conduct a discovery conversation and extract key insights.
            </p>
            <Button className="mt-4" onClick={handleCreate} disabled={createSession.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => {
            const config = statusConfig[session.status] ?? statusConfig.active;
            const StatusIcon = config.icon;
            return (
              <Card key={session.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Session {session.session_token.slice(-8)}
                        </span>
                        <Badge variant={config.variant} className="text-xs">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Started {format(new Date(session.started_at), 'MMM d, yyyy h:mm a')}</span>
                        <span>•</span>
                        <span>Last active {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(session.session_token)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSession(session)}
                    >
                      View Chat
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Session Detail (chat + extracted data) ──────────────────────

function SessionDetail({ session, onBack }: { session: InterviewSession; onBack: () => void }) {
  const { data: messages = [], isLoading: messagesLoading } = useInterviewMessages(session.id);
  const { data: responses = [], isLoading: responsesLoading } = useClientResponses(session.id);

  // Group responses by category
  const grouped = responses.reduce<Record<string, any[]>>((acc, r) => {
    const cat = r.question_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r.extracted_data);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sessions
      </Button>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Session {session.session_token.slice(-8)}
        </h2>
        <Badge variant={statusConfig[session.status]?.variant ?? 'default'}>
          {statusConfig[session.status]?.label ?? session.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat History */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Share the link with your client to start.
              </p>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? '' : ''}`}
                    >
                      <div className={`shrink-0 rounded-full p-1.5 ${
                        msg.role === 'user'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {msg.role === 'user' ? 'Client' : 'AI Assistant'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        </div>
                        <div className="text-sm text-foreground prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Extracted Data Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Extracted Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {responsesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data extracted yet. Insights will appear here as the client answers questions.
              </p>
            ) : (
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-4">
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground capitalize">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      {items.map((item, idx) => (
                        <div key={idx} className="rounded-md bg-muted/50 p-3">
                          <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
