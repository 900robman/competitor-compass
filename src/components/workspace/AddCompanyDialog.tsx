import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CompanyTypeSelect } from '@/components/competitors/CompanyTypeSelect';
import { Loader2 } from 'lucide-react';
import { CompanyType, MonitoringPriority } from '@/types/database';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    url: string;
    companyType: CompanyType;
    priority: MonitoringPriority;
    notes: string;
  }) => Promise<void>;
  isPending: boolean;
}

export function AddCompanyDialog({ open, onOpenChange, onSubmit, isPending }: AddCompanyDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [companyType, setCompanyType] = useState<CompanyType>('direct_competitor');
  const [priority, setPriority] = useState<MonitoringPriority>('medium');
  const [notes, setNotes] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    await onSubmit({ name, url, companyType, priority, notes });
    setName('');
    setUrl('https://');
    setCompanyType('direct_competitor');
    setPriority('medium');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Tracked Company</DialogTitle>
          <DialogDescription>
            Add a new company to track. The n8n workflow will scrape their website.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comp-name">Company Name</Label>
            <Input
              id="comp-name"
              placeholder="e.g., Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-url">Website URL</Label>
            <Input
              id="comp-url"
              ref={urlInputRef}
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => {
                setTimeout(() => {
                  if (urlInputRef.current) {
                    const len = urlInputRef.current.value.length;
                    urlInputRef.current.setSelectionRange(len, len);
                  }
                }, 0);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Type</Label>
              <CompanyTypeSelect value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)} />
            </div>
            <div className="space-y-2">
              <Label>Monitoring Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MonitoringPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes about this company..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
