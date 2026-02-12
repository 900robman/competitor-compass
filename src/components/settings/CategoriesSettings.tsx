import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { usePageCategories, PageCategory } from '@/hooks/usePageCategories';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CategoriesSettings() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = usePageCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PageCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formPriority, setFormPriority] = useState<number>(50);
  const [formColor, setFormColor] = useState('#6366F1');

  const openCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormPattern('');
    setFormPriority(50);
    setFormColor('#6366F1');
    setDialogOpen(true);
  };

  const openEdit = (cat: PageCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormPattern(cat.url_patterns?.join(', ') ?? '');
    setFormPriority(cat.priority);
    setFormColor(cat.color ?? '#6366F1');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const patterns = formPattern.split(',').map((p) => p.trim()).filter(Boolean);
      if (editingCategory) {
        const { error } = await supabase
          .from('page_categories')
          .update({
            name: formName.trim(),
            url_patterns: patterns,
            priority: formPriority,
            color: formColor,
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('page_categories')
          .insert({
            name: formName.trim(),
            url_patterns: patterns,
            priority: formPriority,
            color: formColor,
          });
        if (error) throw error;
        toast.success('Category created');
      }
      queryClient.invalidateQueries({ queryKey: ['pageCategories'] });
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('page_categories')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['pageCategories'] });
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const priorityLabel = (p: number) => {
    if (p >= 70) return 'High';
    if (p >= 40) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage URL pattern-based categories to classify competitor content.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length > 0 ? (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>URL Pattern</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {cat.color && (
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {cat.url_patterns?.join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{priorityLabel(cat.priority)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(cat)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No categories defined yet.</p>
            <Button variant="link" className="mt-2" onClick={openCreate}>
              Create your first category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Product Pages"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Patterns (comma-separated)</Label>
              <Input
                value={formPattern}
                onChange={(e) => setFormPattern(e.target.value)}
                placeholder="/products/*, /shop/*"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={String(formPriority)}
                  onValueChange={(v) => setFormPriority(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="80">High</SelectItem>
                    <SelectItem value="50">Medium</SelectItem>
                    <SelectItem value="20">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-14 p-1"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category. Pages using this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
