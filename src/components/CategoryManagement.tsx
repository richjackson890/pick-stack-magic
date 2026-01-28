import { useState } from 'react';
import { DbCategory } from '@/hooks/useDbCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, GripVertical, Pencil, Trash2, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconPicker, IconDisplay } from '@/components/IconPicker';
import { CategoryTemplates } from '@/components/CategoryTemplates';
import { CategoryTemplate, migrateIconKey } from '@/lib/iconRegistry';

interface CategoryManagementProps {
  isOpen: boolean;
  categories: DbCategory[];
  onClose: () => void;
  onAdd: (category: { name: string; color: string; icon?: string; keywords?: string }) => Promise<DbCategory | null>;
  onUpdate: (id: string, updates: Partial<DbCategory>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorder: (categories: DbCategory[]) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#10b981', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#64748b',
];

export function CategoryManagement({ isOpen, categories, onClose, onAdd, onUpdate, onDelete, onReorder }: CategoryManagementProps) {
  const [editingCategory, setEditingCategory] = useState<DbCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DbCategory | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formIcon, setFormIcon] = useState('emoji:📁');
  const [formKeywords, setFormKeywords] = useState('');

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  const resetForm = () => {
    setFormName('');
    setFormColor(PRESET_COLORS[0]);
    setFormIcon('emoji:📁');
    setFormKeywords('');
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (category: DbCategory) => {
    setFormName(category.name);
    setFormColor(category.color);
    setFormIcon(migrateIconKey(category.icon));
    setFormKeywords(category.keywords || '');
    setEditingCategory(category);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    if (editingCategory) {
      await onUpdate(editingCategory.id, {
        name: formName.trim(),
        color: formColor,
        icon: formIcon,
        keywords: formKeywords.trim(),
      });
      setEditingCategory(null);
    } else {
      await onAdd({
        name: formName.trim(),
        color: formColor,
        icon: formIcon,
        keywords: formKeywords.trim(),
      });
      setIsAddDialogOpen(false);
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleTemplatesSelect = async (templates: CategoryTemplate[]) => {
    for (const template of templates) {
      await onAdd({
        name: template.name,
        color: template.color,
        icon: template.icon,
        keywords: template.keywords,
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sortedCategories];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    onReorder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              카테고리 관리
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Quick Add Templates */}
            <Button
              variant="outline"
              className="w-full bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20 hover:border-primary/40"
              onClick={() => setIsTemplatesOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              추천 카테고리에서 추가
            </Button>

            {/* Category List */}
            <div className="space-y-2">
              {sortedCategories.map((category, index) => (
                <div
                  key={category.id}
                  draggable={!category.is_default}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-all',
                    draggedIndex === index && 'opacity-50 scale-95',
                    !category.is_default && 'cursor-grab active:cursor-grabbing'
                  )}
                >
                  {!category.is_default && (
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-inner"
                    style={{ backgroundColor: category.color }}
                  >
                    <IconDisplay 
                      iconKey={migrateIconKey(category.icon)} 
                      size="sm" 
                      className="text-white drop-shadow-sm" 
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{category.name}</p>
                    {category.keywords && (
                      <p className="text-xs text-muted-foreground truncate">
                        {category.keywords}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!category.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={openAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              새 카테고리 추가
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              드래그하여 순서 변경 • 키워드로 AI 자동분류 정확도 향상
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={isAddDialogOpen || !!editingCategory} 
        onOpenChange={() => {
          setIsAddDialogOpen(false);
          setEditingCategory(null);
          resetForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '카테고리 수정' : '새 카테고리'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="flex items-center justify-center py-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ backgroundColor: formColor }}
              >
                <IconDisplay iconKey={formIcon} size="lg" className="text-white drop-shadow-md scale-125" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">이름</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="카테고리 이름"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">아이콘</label>
              <IconPicker 
                value={formIcon} 
                onChange={setFormIcon} 
                color={formColor}
                trigger={
                  <button
                    className={cn(
                      'w-full h-12 rounded-lg flex items-center justify-center gap-3 transition-all',
                      'border-2 border-dashed border-muted-foreground/30 hover:border-primary/50',
                      'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formColor }}
                    >
                      <IconDisplay iconKey={formIcon} size="md" className="text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">아이콘 변경</span>
                  </button>
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">색상</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all hover:scale-110',
                      formColor === color && 'ring-2 ring-offset-2 ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">키워드 (선택)</label>
              <Textarea
                value={formKeywords}
                onChange={(e) => setFormKeywords(e.target.value)}
                placeholder="AI 분류용 키워드 (쉼표로 구분)&#10;예: 비타민, 오메가3, 루틴"
                className="mt-1 min-h-[60px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                키워드를 추가하면 AI가 더 정확하게 분류합니다
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingCategory ? '저장' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{deleteConfirm?.name}" 카테고리를 삭제하시겠습니까?
            <br />
            이 카테고리의 항목들은 "기타"로 이동됩니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Templates Dialog */}
      <CategoryTemplates
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplates={handleTemplatesSelect}
        existingCategoryNames={categories.map(c => c.name)}
      />
    </>
  );
}
