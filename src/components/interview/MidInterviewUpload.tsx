import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface MidInterviewUploadProps {
  sessionToken: string;
  sessionId: string;
}

export function MidInterviewUploadButton({ sessionToken, sessionId }: MidInterviewUploadProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');

  const resetAndClose = () => {
    setOpen(false);
    setStatus('idle');
  };

  const pollForCompletion = useCallback(async (documentId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from('interview_documents')
          .select('processing_status')
          .eq('id', documentId)
          .single();

        if (data?.processing_status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          toast.success('Document uploaded and processed!');
          setTimeout(resetAndClose, 1500);
          resolve();
        } else if (data?.processing_status === 'failed' || attempts >= maxAttempts) {
          clearInterval(interval);
          setStatus(data?.processing_status === 'completed' ? 'completed' : 'error');
          resolve();
        }
      }, 1000);
    });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setStatus('uploading');

    try {
      const filePath = `${sessionToken}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('interview-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setStatus('error');
        return;
      }

      setStatus('processing');

      const { data: docData, error: docError } = await supabase
        .from('interview_documents')
        .insert({
          interview_session_id: sessionId,
          filename: file.name,
          file_type: file.name.split('.').pop()?.toLowerCase() ?? 'unknown',
          file_url: filePath,
          file_size_bytes: file.size,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (docError) {
        console.error('Doc record error:', docError);
        setStatus('error');
        return;
      }

      await pollForCompletion(docData.id);
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error');
    }
  }, [sessionToken, sessionId, pollForCompletion]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Upload document"
      >
        <Upload className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Additional Document</DialogTitle>
            <DialogDescription>
              Add a resume, brand guidelines, or other relevant document to provide more context.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {status === 'idle' && (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => document.getElementById('mid-interview-file-input')?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, DOC, or TXT (max 10MB)</p>
                <input
                  id="mid-interview-file-input"
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
            )}

            {status === 'uploading' && (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm font-medium">Uploading file…</p>
              </div>
            )}

            {status === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
                <p className="text-sm font-medium">Processing document…</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 10–30 seconds</p>
              </div>
            )}

            {status === 'completed' && (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p className="text-sm font-medium">Document processed successfully!</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
                <p className="text-sm font-medium">Upload failed. Please try again.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setStatus('idle')}>
                  Try Again
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetAndClose}>
              {status === 'completed' ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
