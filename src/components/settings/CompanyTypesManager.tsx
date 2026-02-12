import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCompanyTypes,
  useCreateCompanyType,
  useUpdateCompanyType,
  useDeleteCompanyType,
  CompanyTypeRecord,
} from '@/hooks/useCompanyTypes';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Save, X, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function CompanyTypesManager() {
  const { data: types = [], isLoading } = useCompanyTypes();
  const createType = useCreateCompanyType();
  const updateType = useUpdateCompanyType();
  const deleteType = useDeleteCompanyType();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CompanyTypeRecord> | null>(null);
  const [newType, setNewType] = useState<{ label: string; color: string; description: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyTypeRecord | null>(null);
  const [deleteUsageCount, setDeleteUsageCount] = useState<number>(0);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const handleCreate = async () => {
    if (!newType?.label.trim()) {
      toast.error('Label is required');
      return;
    }
    const value = slugify(newType.label);
    if (types.some((t) => t.value === value)) {
      toast.error('A type with this value already exists');
      return;
    }
    try {
      await createType.mutateAsync({
        value,
        label: newType.label.trim(),
        color: newType.color || '#6366F1',
        description: newType.description.trim() || undefined,
      });
      toast.success(`"${newType.label}" created`);
      setNewType(null);
    } catch (error) {
      toast.error('Failed to create type', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleSave = async () => {
    if (!editData || !editingId) return;
    try {
      await updateType.mutateAsync({
        id: editingId,
        updates: {
          label: editData.label,
          color: editData.color,
          description: editData.description,
          is_active: editData.is_active,
        },
      });
      toast.success('Type updated');
      setEditingId(null);
      setEditData(null);
    } catch (error) {
      toast.error('Failed to update', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDeleteClick = async (type: CompanyTypeRecord) => {
    setLoadingUsage(true);
    setDeleteTarget(type);
    try {
      const { count, error } = await supabase
        .from('competitors')
        .select('*', { count: 'exact', head: true })
        .eq('company_type', type.value);
      setDeleteUsageCount(error ? 0 : count ?? 0);
    } catch {
      setDeleteUsageCount(0);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      // Null out the company_type on affected competitors first
      if (deleteUsageCount > 0) {
        await supabase
          .from('competitors')
          .update({ company_type: null })
          .eq('company_type', deleteTarget.value);
      }
      await deleteType.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.label}" deleted`);
    } catch (error) {
      toast.error('Failed to delete', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (type: CompanyTypeRecord) => {
    setEditingId(type.id);
    setEditData({ ...type });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Types</CardTitle>
        <CardDescription>
          Manage the types used to categorize tracked companies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add button */}
        {!newType && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewType({ label: '', color: '#6366F1', description: '' })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Type
          </Button>
        )}

        {/* New type form */}
        {newType && (
          <div className="space-y-3 rounded-lg border border-primary/50 bg-muted/30 p-4">
            <div className="space-y-1.5">
              <Label>Label *</Label>
              <Input
                value={newType.label}
                onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                placeholder="e.g., Strategic Partner"
              />
              {newType.label && (
                <p className="text-xs text-muted-foreground">
                  Value: <code className="rounded bg-muted px-1">{slugify(newType.label)}</code>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="w-14 p-1"
                  />
                  <Input
                    value={newType.color}
                    onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createType.isPending}>
                {createType.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNewType(null)}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Types list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : types.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No company types defined yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {types.map((type) => {
              if (editingId === type.id && editData) {
                return (
                  <div
                    key={type.id}
                    className="space-y-3 rounded-lg border border-primary/50 bg-muted/30 p-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Label</Label>
                        <Input
                          value={editData.label ?? ''}
                          onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editData.color ?? '#6366F1'}
                            onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                            className="w-14 p-1"
                          />
                          <Input
                            value={editData.color ?? ''}
                            onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        value={editData.description ?? ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label>Active</Label>
                        <Switch
                          checked={editData.is_active ?? true}
                          onCheckedChange={(v) => setEditData({ ...editData, is_active: v })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={updateType.isPending}>
                        {updateType.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditData(null);
                        }}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={type.id}
                  className={`flex items-center gap-3 rounded-lg border border-border px-4 py-3 ${
                    !type.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div
                    className="h-4 w-4 rounded shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{type.label}</span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {type.value}
                      </Badge>
                      {!type.is_active && (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {type.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(type)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(type)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {loadingUsage ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking usage…
                  </div>
                ) : deleteUsageCount > 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {deleteUsageCount} tracked compan{deleteUsageCount !== 1 ? 'ies' : 'y'} currently use this type.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Their company type will be set to unassigned.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>This company type is not currently used by any tracked companies.</p>
                )}
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loadingUsage}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
