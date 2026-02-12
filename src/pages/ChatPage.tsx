import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { useProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, Sparkles } from 'lucide-react';

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const [message, setMessage] = useState('');

  return (
    <DashboardLayout projectName={project?.name}>
      <Header title="Chat with Project Data" subtitle="Ask questions about your tracked company insights" />
      <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
        <ScrollArea className="flex-1 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Chat with your data</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This feature will let you ask questions about your collected company data using AI. The RAG backend will be connected soon.
            </p>
          </div>
        </ScrollArea>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Ask questions about your tracked company data..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled
          />
          <Button disabled>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
