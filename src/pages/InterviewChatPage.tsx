import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, User, Bot, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface SessionData {
  id: string;
  session_token: string;
  status: string;
  projects: { name: string } | null;
}

export default function InterviewChatPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const edgeFn = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('interview-public', {
      body: { action, session_token: token, ...extra },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error ?? 'Unknown error');
    return data.data;
  }, [token]);

  // Load session
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const s = await edgeFn('get_session');
        setSession(s);
        const msgs = await edgeFn('get_messages');
        setMessages(msgs ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, edgeFn]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic user message
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    setSending(true);

    try {
      await edgeFn('send_message', { message: text });
      // Refresh messages from DB
      const msgs = await edgeFn('get_messages');
      setMessages(msgs ?? []);
    } catch {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Interview Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {error || 'This interview session could not be found or may have expired.'}
        </p>
      </div>
    );
  }

  const projectName = session.projects?.name ?? 'Interview';
  const isExpired = session.status === 'expired' || session.status === 'cancelled' || session.status === 'completed';

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 shrink-0">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-foreground">{projectName}</h1>
          <p className="text-sm text-muted-foreground">Website Redesign Interview</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
            {messages.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-medium text-foreground">Welcome!</h2>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Send a message to begin the interview. The AI assistant will guide you through a series of questions.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className={`shrink-0 mt-0.5 rounded-full p-2 ${
                    msg.role === 'user'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
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

            {sending && (
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5 rounded-full p-2 bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      {!isExpired ? (
        <div className="border-t border-border px-6 py-4 shrink-0">
          <div className="mx-auto max-w-3xl flex gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message…"
              disabled={sending}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border px-6 py-4 shrink-0">
          <p className="text-center text-sm text-muted-foreground">
            This interview session has ended. Thank you for your time!
          </p>
        </div>
      )}
    </div>
  );
}
