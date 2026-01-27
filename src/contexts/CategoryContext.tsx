import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomCategory, DEFAULT_CATEGORIES } from '@/types/pickstack';

interface CategoryContextType {
  categories: CustomCategory[];
  addCategory: (category: Omit<CustomCategory, 'id' | 'created_at' | 'sort_order'>) => void;
  updateCategory: (id: string, updates: Partial<CustomCategory>) => void;
  deleteCategory: (id: string, moveToCategory?: string) => void;
  reorderCategories: (categories: CustomCategory[]) => void;
  getCategoryById: (id: string) => CustomCategory | undefined;
  getCategoryByName: (name: string) => CustomCategory | undefined;
  getDefaultCategory: () => CustomCategory;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const STORAGE_KEY = 'pickstack_categories';

function generateId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function initializeCategories(): CustomCategory[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If parsing fails, initialize with defaults
    }
  }
  
  // Initialize with default categories
  const now = new Date().toISOString();
  const defaultCats: CustomCategory[] = DEFAULT_CATEGORIES.map((cat, index) => ({
    ...cat,
    id: generateId(),
    created_at: now,
    sort_order: index,
  }));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCats));
  return defaultCats;
}

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CustomCategory[]>(initializeCategories);

  // Persist to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: Omit<CustomCategory, 'id' | 'created_at' | 'sort_order'>) => {
    const newCategory: CustomCategory = {
      ...category,
      id: generateId(),
      created_at: new Date().toISOString(),
      sort_order: categories.length,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<CustomCategory>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string, moveToCategory?: string) => {
    const defaultCat = categories.find(c => c.is_default);
    const targetCategoryId = moveToCategory || defaultCat?.id;
    
    // Don't allow deleting the default category
    const categoryToDelete = categories.find(c => c.id === id);
    if (categoryToDelete?.is_default) {
      return;
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
    
    // Note: Items migration should be handled by the parent component
    // This is just for the category list management
  };

  const reorderCategories = (newOrder: CustomCategory[]) => {
    const reordered = newOrder.map((cat, index) => ({
      ...cat,
      sort_order: index,
    }));
    setCategories(reordered);
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
  };

  const getCategoryByName = (name: string) => {
    return categories.find(cat => cat.name === name);
  };

  const getDefaultCategory = () => {
    return categories.find(cat => cat.is_default) || categories[categories.length - 1];
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        getCategoryById,
        getCategoryByName,
        getDefaultCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
