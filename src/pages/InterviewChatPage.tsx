import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, User, Bot, MessageSquare, CheckCircle2 } from 'lucide-react';
import { MidInterviewUploadButton } from '@/components/interview/MidInterviewUpload';
import { YesNoQuestion, CheckboxQuestion, MultiSelectQuestion } from '@/components/interview/QuestionTypes';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  question_type?: string;
  options?: string[];
  selected_options?: string[];
  metadata?: {
    explanation?: string;
  };
}

interface SessionData {
  id: string;
  session_token: string;
  status: string;
  projects: { name: string } | null;
}

export default function InterviewChatPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const edgeFn = useCallback(async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('interview-public', {
      body: { action, session_token: token, ...extra },
    });
    if (error) throw error;
    if (!data.success) throw new Error(data.error ?? 'Unknown error');
    return data.data;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const s = await edgeFn('get_session');
        setSession(s);
        const msgs = await edgeFn('get_messages');
        const messageList = msgs ?? [];
        if (messageList.length === 0) {
          navigate(`/interview/${token}/setup`, { replace: true });
          return;
        }
        setMessages(messageList);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, edgeFn]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message?: string, selectedOptions?: string[]) => {
    const text = message || input.trim();
    if (!text || sending) return;

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      selected_options: selectedOptions,
    };
    setMessages(prev => [...prev, tempMsg]);
    setInput('');
    setSending(true);

    try {
      await edgeFn('send_message', { 
        message: text,
        selected_options: selectedOptions 
      });
      const msgs = await edgeFn('get_messages');
      setMessages(msgs ?? []);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderQuestionInput = () => {
    if (isExpired || messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return null;
    const questionType = lastMessage.question_type || 'open';
    const explanation = lastMessage.metadata?.explanation;

    switch (questionType) {
      case 'yesno':
        return (
          <YesNoQuestion
            question={lastMessage.content}
            explanation={explanation}
            onAnswer={(answer) => handleSend(answer)}
          />
        );
      case 'checkbox':
        return (
          <CheckboxQuestion
            question={lastMessage.content}
            options={lastMessage.options || []}
            explanation={explanation}
            onAnswer={(selected) => {
              const answer = `Selected: ${selected.join(', ')}`;
              handleSend(answer, selected);
            }}
          />
        );
      case 'multiselect':
        return (
          <MultiSelectQuestion
            question={lastMessage.content}
            options={lastMessage.options || []}
            explanation={explanation}
            onAnswer={(selected) => {
              const answer = `Selected: ${selected.join(', ')}`;
              handleSend(answer, selected);
            }}
          />
        );
      case 'open':
      default:
        return (
          <div className="relative flex items-center bg-white rounded-xl shadow-lg border-2 border-border transition-all overflow-hidden p-2 group focus-within:border-primary">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={sending}
              className="w-full border-none focus:ring-0 focus:outline-none text-foreground py-3 px-4 placeholder:text-muted-foreground bg-transparent text-base"
            />
            <div className="flex items-center gap-1 pr-2">
              {session && (
                <MidInterviewUploadButton
                  sessionToken={token!}
                  sessionId={session.id}
                />
              )}
              <button
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--chat-bg))]">
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
    <div className="flex h-screen flex-col bg-[hsl(var(--chat-bg))]">
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6 shrink-0 relative">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Website Redesign Interview</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 chat-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-4">Loading interview…</p>
            </div>
          )}

          {messages.map((msg) =>
            msg.role === 'user' ? (
              <UserBubble key={msg.id} msg={msg} />
            ) : (
              <AssistantBubble key={msg.id} msg={msg} />
            )
          )}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-white border border-border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 bg-[hsl(var(--chat-bg))]">
        <div className="max-w-4xl mx-auto">
          {!isExpired ? (
            <>
              {renderQuestionInput()}
              <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium uppercase tracking-widest">
                AI Assistant may generate inaccurate info. Verify results.
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              This interview session has ended. Thank you for your time!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bubble Components ─────────────────────────────────── */

function AssistantBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-[85%]">
        <div className="bg-white border border-border px-5 py-3.5 rounded-2xl rounded-tl-none shadow-sm text-foreground leading-relaxed text-[13px]">
          <div className="prose prose-xs max-w-none [&_p]:text-[13px] [&_li]:text-[13px]">
            <ReactMarkdown skipHtml>{msg.content}</ReactMarkdown>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium px-1">
          {format(new Date(msg.created_at), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}

function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-start gap-3 flex-row-reverse">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md">
        <User className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-[75%] items-end">
        <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl rounded-tr-none shadow-sm text-foreground leading-relaxed text-[13px]">
          {msg.selected_options && msg.selected_options.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-foreground">Selected:</p>
              {msg.selected_options.map((opt) => (
                <div key={opt} className="flex items-center gap-1.5 text-[13px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="prose prose-xs max-w-none [&_p]:text-[13px] [&_li]:text-[13px]">
              <ReactMarkdown skipHtml>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium px-1 text-right">
          {format(new Date(msg.created_at), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
