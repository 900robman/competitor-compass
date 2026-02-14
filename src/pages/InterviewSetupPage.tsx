import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  ArrowRight,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
};
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedFile {
  id?: string;
  file: File;
  filename: string;
  sizeBytes: number;
  status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function InterviewSetupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Interview');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [websitePageCount, setWebsitePageCount] = useState<number>(0);

  // Load session
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('interview-public', {
          body: { action: 'get_session', session_token: token },
        });
        if (fnError || !data?.success) throw new Error(data?.error ?? 'Session not found');
        setSessionId(data.data.id);
        setProjectName(data.data.projects?.name ?? 'Interview');

        // Get website page count
        if (data.data.project_id) {
          const { count } = await supabase
            .from('competitor_pages')
            .select('*', { count: 'exact', head: true })
            .eq('competitor_id', data.data.project_id);
          setWebsitePageCount(count ?? 0);
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Poll for status updates
  useEffect(() => {
    if (!sessionId) return;
    const pendingFiles = files.filter(f => f.id && (f.status === 'pending' || f.status === 'processing'));
    if (pendingFiles.length === 0) return;

    const interval = setInterval(async () => {
      const ids = pendingFiles.map(f => f.id!);
      const { data } = await supabase
        .from('interview_documents')
        .select('id, processing_status')
        .in('id', ids);

      if (data) {
        setFiles(prev =>
          prev.map(f => {
            const updated = data.find(d => d.id === f.id);
            if (updated) {
              return { ...f, status: updated.processing_status as UploadedFile['status'] };
            }
            return f;
          })
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, files]);

  const uploadFile = useCallback(async (file: File) => {
    if (!token || !sessionId) return;

    // Validate type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast({ title: 'Unsupported file type', description: `Only PDF, DOCX, DOC, and TXT files are accepted.`, variant: 'destructive' });
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: `Maximum file size is 10MB. "${file.name}" is ${formatFileSize(file.size)}.`, variant: 'destructive' });
      return;
    }
    // Check duplicate
    if (files.some(f => f.filename === file.name && f.status !== 'failed')) return;

    const newFile: UploadedFile = {
      file,
      filename: file.name,
      sizeBytes: file.size,
      status: 'uploading',
      progress: 0,
    };
    setFiles(prev => [...prev, newFile]);

    try {
      // Upload to storage
      const path = `${token}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('interview-documents')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      setFiles(prev =>
        prev.map(f => (f.filename === file.name && f.status === 'uploading' ? { ...f, progress: 80 } : f))
      );

      // Create DB record
      const fileType = ACCEPTED_TYPES[file.type] || ext.replace('.', '');
      const { data: doc, error: dbError } = await supabase
        .from('interview_documents')
        .insert({
          interview_session_id: sessionId,
          filename: file.name,
          file_type: fileType,
          file_url: path,
          file_size_bytes: file.size,
          processing_status: 'pending',
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      setFiles(prev =>
        prev.map(f =>
          f.filename === file.name && f.status === 'uploading'
            ? { ...f, id: doc.id, status: 'pending', progress: 100 }
            : f
        )
      );
    } catch (e: any) {
      setFiles(prev =>
        prev.map(f =>
          f.filename === file.name && f.status === 'uploading'
            ? { ...f, status: 'failed', error: e.message ?? 'Upload failed' }
            : f
        )
      );
    }
  }, [token, sessionId, files]);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    Array.from(fileList).forEach(uploadFile);
  }, [uploadFile]);

  const removeFile = async (filename: string) => {
    const file = files.find(f => f.filename === filename);
    if (file?.id) {
      await supabase.from('interview_documents').delete().eq('id', file.id);
      await supabase.storage.from('interview-documents').remove([`${token}/${filename}`]);
    }
    setFiles(prev => prev.filter(f => f.filename !== filename));
  };

  const retryFile = (filename: string) => {
    const file = files.find(f => f.filename === filename);
    if (file) {
      setFiles(prev => prev.filter(f => f.filename !== filename));
      uploadFile(file.file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleStart = async () => {
    if (files.length > 0 && sessionId) {
      await supabase.functions.invoke('interview-public', {
        body: { action: 'update_session', session_token: token, has_uploaded_docs: true },
      }).catch(() => {});
    }
    navigate(`/interview/${token}`);
  };

  const allProcessed = files.length === 0 || files.every(f => f.status === 'completed' || f.status === 'failed');
  const hasUploading = files.some(f => f.status === 'uploading' || f.status === 'pending' || f.status === 'processing');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--chat-bg))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Interview Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {error || 'This interview session could not be found or may have expired.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[hsl(var(--chat-bg))]">
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6 shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">{projectName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Website Redesign Interview</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 chat-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-2 pt-4">
            <h2 className="text-3xl font-bold text-foreground">Let's Get Started</h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Help us understand your business by uploading any existing documents (optional)
            </p>
          </div>

          {/* Website card */}
          {websitePageCount > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                    Already reviewed: Your website ({websitePageCount} pages)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We've already analysed your website content
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-primary/[0.02]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or <span className="text-primary font-medium">click to browse</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, DOC, TXT — Max 10MB per file
              </p>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Uploaded Documents</p>
              <div className="space-y-2">
                {files.map((f) => (
                  <FileRow
                    key={f.filename}
                    file={f}
                    onRemove={() => removeFile(f.filename)}
                    onRetry={() => retryFile(f.filename)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleStart}
            className="text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1.5" />
            Skip & Start Interview
          </Button>
          <Button
            onClick={handleStart}
            disabled={hasUploading}
            className="px-6"
          >
            Start Interview
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── File Row ───────────────────────────────────────────── */

function FileRow({
  file,
  onRemove,
  onRetry,
}: {
  file: UploadedFile;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const statusConfig: Record<UploadedFile['status'], { icon: React.ReactNode; label: string; color: string }> = {
    uploading: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
      label: 'Uploading…',
      color: 'text-primary',
    },
    pending: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
      label: 'Processing…',
      color: 'text-muted-foreground',
    },
    processing: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
      label: 'Processing…',
      color: 'text-muted-foreground',
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
      label: 'Ready ✓',
      color: 'text-[hsl(var(--success))]',
    },
    failed: {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      label: 'Failed ✗',
      color: 'text-destructive',
    },
  };

  const s = statusConfig[file.status];

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.filename}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{formatFileSize(file.sizeBytes)}</span>
            <span className="text-xs text-border">•</span>
            <span className={`text-xs flex items-center gap-1 ${s.color}`}>
              {s.icon} {s.label}
            </span>
          </div>
          {file.status === 'uploading' && (
            <Progress value={file.progress} className="h-1 mt-1.5" />
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {file.status === 'failed' && (
            <Button variant="ghost" size="icon" onClick={onRetry} className="h-8 w-8">
              <Upload className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
