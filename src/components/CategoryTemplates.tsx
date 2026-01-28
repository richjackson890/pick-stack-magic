import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus, Check, Sparkles } from 'lucide-react';
import { 
  CATEGORY_TEMPLATES, 
  TEMPLATE_GROUP_LABELS,
  CategoryTemplate,
  getIconComponent 
} from '@/lib/iconRegistry';
import { IconDisplay } from '@/components/IconPicker';

interface CategoryTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplates: (templates: CategoryTemplate[]) => void;
  existingCategoryNames: string[];
}

export function CategoryTemplates({ 
  isOpen, 
  onClose, 
  onSelectTemplates,
  existingCategoryNames 
}: CategoryTemplatesProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  
  const toggleTemplate = (name: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedTemplates(newSelected);
  };
  
  const handleConfirm = () => {
    const templates = CATEGORY_TEMPLATES.filter(t => selectedTemplates.has(t.name));
    onSelectTemplates(templates);
    setSelectedTemplates(new Set());
    onClose();
  };
  
  const groupedTemplates = {
    essential: CATEGORY_TEMPLATES.filter(t => t.group === 'essential'),
    creator: CATEGORY_TEMPLATES.filter(t => t.group === 'creator'),
    life: CATEGORY_TEMPLATES.filter(t => t.group === 'life'),
  };
  
  const renderTemplateCard = (template: CategoryTemplate) => {
    const isSelected = selectedTemplates.has(template.name);
    const alreadyExists = existingCategoryNames.some(
      name => name.toLowerCase() === template.name.toLowerCase()
    );
    
    return (
      <button
        key={template.name}
        onClick={() => !alreadyExists && toggleTemplate(template.name)}
        disabled={alreadyExists}
        className={cn(
          'relative flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full',
          'border-2',
          alreadyExists && 'opacity-50 cursor-not-allowed',
          isSelected 
            ? 'border-primary bg-primary/10 shadow-sm' 
            : 'border-transparent bg-muted/50 hover:bg-muted'
        )}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner"
          style={{ backgroundColor: template.color }}
        >
          <IconDisplay iconKey={template.icon} size="lg" className="text-white drop-shadow-sm" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{template.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {template.keywords.split(',').slice(0, 3).join(', ')}
          </p>
        </div>
        
        {alreadyExists ? (
          <span className="text-xs text-muted-foreground">이미 있음</span>
        ) : isSelected ? (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
        )}
      </button>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            추천 카테고리
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            미리 설정된 카테고리를 빠르게 추가하세요
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] px-4">
          <div className="space-y-6 pb-4">
            {(['essential', 'creator', 'life'] as const).map(group => (
              <div key={group}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {TEMPLATE_GROUP_LABELS[group]}
                </h3>
                <div className="space-y-2">
                  {groupedTemplates[group].map(renderTemplateCard)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 pt-3 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedTemplates.size}개 선택됨
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={selectedTemplates.size === 0}
              >
                <Plus className="w-4 h-4 mr-1" />
                추가하기
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
