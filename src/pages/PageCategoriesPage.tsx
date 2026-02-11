import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout, Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Save, X, Pencil, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { usePageCategories } from '@/hooks/usePageCategories';

export default function PageCategoriesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const { data: categories = [], isLoading, refetch } = usePageCategories();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [newCategory, setNewCategory] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleSave = async () => {
    if (!editData) return;
    const { error } = await supabase
      .from('page_categories')
      .update({
        name: editData.name,
        url_patterns: editData.url_patterns,
        description: editData.description,
        color: editData.color,
        priority: editData.priority,
        is_active: editData.is_active,
      })
      .eq('id', editData.id);

    if (error) {
      toast.error('Failed to update category', { description: error.message });
    } else {
      toast.success(`${editData.name} updated`);
      setEditingId(null);
      setEditData(null);
      refetch();
    }
  };

  const handleCreate = async () => {
    if (!newCategory?.name || !newCategory?.url_patterns?.length) {
      toast.error('Name and at least one URL pattern are required');
      return;
    }
    const { error } = await supabase
      .from('page_categories')
      .insert({
        name: newCategory.name,
        url_patterns: newCategory.url_patterns,
        description: newCategory.description || null,
        color: newCategory.color || '#6366F1',
        priority: newCategory.priority || 100,
        is_active: true,
      });

    if (error) {
      toast.error('Failed to create category', { description: error.message });
    } else {
      toast.success(`${newCategory.name} created`);
      setNewCategory(null);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('page_categories')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      toast.error('Failed to delete category', { description: error.message });
    } else {
      toast.success(`${deleteTarget.name} deleted`);
      refetch();
    }
    setDeleteTarget(null);
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditData({ ...cat });
  };

  return (
    <DashboardLayout projectName={project?.name}>
      <Header title="Page Categories" subtitle="Manage URL patterns for automatic page categorization" />
      <div className="max-w-3xl space-y-6 p-6">

        {/* Add button */}
        {!newCategory && (
          <Button
            onClick={() => setNewCategory({ name: '', url_patterns: [], priority: 100, color: '#6366F1', is_active: true })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}

        {/* New category form */}
        {newCategory && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-base">New Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={newCategory.name || ''} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g., Resources" />
              </div>
              <div className="space-y-1.5">
                <Label>URL Patterns * (comma-separated)</Label>
                <Input
                  value={newCategory.url_patterns?.join(', ') || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, url_patterns: e.target.value.split(',').map((p: string) => p.trim()).filter(Boolean) })}
                  placeholder="/resources, /guides, /learn"
                />
                <p className="text-xs text-muted-foreground">Case-insensitive substring match against URLs</p>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={newCategory.description || ''} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Input type="number" value={newCategory.priority || 100} onChange={(e) => setNewCategory({ ...newCategory, priority: parseInt(e.target.value) || 100 })} />
                  <p className="text-xs text-muted-foreground">Lower = checked first</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={newCategory.color || '#6366F1'} onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })} className="w-14 p-1" />
                    <Input value={newCategory.color || '#6366F1'} onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} size="sm"><Save className="mr-1.5 h-3.5 w-3.5" />Create</Button>
                <Button onClick={() => setNewCategory(null)} variant="outline" size="sm"><X className="mr-1.5 h-3.5 w-3.5" />Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading categories…</p>
        ) : categories.length === 0 ? (
          <Card className="border-dashed">
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No categories found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {categories.map((cat: any) => {
              const isEditing = editingId === cat.id;

              if (isEditing && editData) {
                return (
                  <Card key={cat.id} className="border-primary/50">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>URL Patterns (comma-separated)</Label>
                        <Input
                          value={editData.url_patterns?.join(', ') || ''}
                          onChange={(e) => setEditData({ ...editData, url_patterns: e.target.value.split(',').map((p: string) => p.trim()).filter(Boolean) })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Input value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Priority</Label>
                          <Input type="number" value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 1 })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Color</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={editData.color || '#6366F1'} onChange={(e) => setEditData({ ...editData, color: e.target.value })} className="w-14 p-1" />
                            <Input value={editData.color || '#6366F1'} onChange={(e) => setEditData({ ...editData, color: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Active</Label>
                          <div className="pt-2">
                            <Switch checked={editData.is_active} onCheckedChange={(v) => setEditData({ ...editData, is_active: v })} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm"><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button>
                        <Button onClick={() => { setEditingId(null); setEditData(null); }} variant="outline" size="sm"><X className="mr-1.5 h-3.5 w-3.5" />Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={cat.id} className={!cat.is_active ? 'opacity-50' : ''}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: cat.color || '#6366F1' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{cat.name}</span>
                        <Badge variant="outline" className="text-[10px]">P{cat.priority}</Badge>
                        {!cat.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                      {cat.description && <p className="text-xs text-muted-foreground mb-1">{cat.description}</p>}
                      <div className="flex flex-wrap gap-1">
                        {(cat.url_patterns || []).map((p: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-mono">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing pages won't be deleted, but won't be auto-categorized with this category anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
