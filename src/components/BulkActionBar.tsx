import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, FolderInput, X, CheckSquare } from 'lucide-react';
import { DbCategory } from '@/hooks/useDbCategories';
import { useState } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  categories: DbCategory[];
  onDelete: () => void;
  onMoveCategory: (categoryId: string) => void;
  onCancel: () => void;
  onSelectAll: () => void;
}

export function BulkActionBar({ selectedCount, categories, onDelete, onMoveCategory, onCancel, onSelectAll }: BulkActionBarProps) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <>
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-2 right-2 z-40 glass-sheet rounded-2xl p-3 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                {selectedCount}개 선택됨
              </span>
              <div className="flex gap-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onSelectAll}
                  className="glass-button px-2.5 py-1.5 text-xs font-medium flex items-center gap-1"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  전체
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className="glass-button px-2.5 py-1.5 text-xs font-medium flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  취소
                </motion.button>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="flex-1 glass-button py-2.5 px-3 text-sm font-medium flex items-center justify-center gap-2 text-foreground"
              >
                <FolderInput className="h-4 w-4" />
                카테고리 이동
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="flex-1 glass-button py-2.5 px-3 text-sm font-medium flex items-center justify-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </motion.button>
            </div>

            {/* Category Picker */}
            <AnimatePresence>
              {showCategoryPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    {categories.map(cat => (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onMoveCategory(cat.id);
                          setShowCategoryPicker(false);
                        }}
                        className="glass-chip px-3 py-1.5 text-xs font-medium flex items-center gap-1 hover:ring-1 hover:ring-primary/50 transition-all"
                      >
                        <span>{cat.icon}</span>
                        {cat.name}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
