import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform } from '@/types/pickstack';
import { supabase } from '@/integrations/supabase/client';
import { LiquidSpinner } from '@/components/LiquidSpinner';
import { PlatformIcon } from '@/components/PlatformIcon';
import { TextThumbnailCard, isForceTextThumb, fallbackKeywords } from '@/components/PickStackThumbs';
import { ExternalLink, Eye, Calendar, ArrowLeft, FolderOpen, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicItem {
  id: string;
  title: string;
  url: string | null;
  platform: Platform;
  thumbnail_url: string | null;
  summary_3lines: string[];
  tags: string[];
  created_at: string;
}

interface PublicCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

type ViewType = 'item' | 'collection' | 'loading' | 'error' | 'not-found';

export default function PublicView() {
  const { code } = useParams<{ code: string }>();
  const [viewType, setViewType] = useState<ViewType>('loading');
  const [item, setItem] = useState<PublicItem | null>(null);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [category, setCategory] = useState<PublicCategory | null>(null);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  useEffect(() => {
    if (!code) {
      setViewType('not-found');
      return;
    }

    fetchPublicContent(code);
  }, [code]);

  const fetchPublicContent = async (shareCode: string) => {
    try {
      // Try shared item via secure RPC (no direct table access)
      const { data: itemResult } = await supabase.rpc('get_shared_item_public', {
        p_share_code: shareCode
      });

      if (itemResult) {
        const result = itemResult as any;
        
        // Increment view count atomically
        const { data: newCount } = await supabase.rpc('increment_shared_view_count', {
          p_share_code: shareCode,
          p_table_name: 'shared_items'
        });
        
        setViewCount(newCount || result.shared.view_count + 1);
        setItem(result.item as PublicItem);
        if (result.category) {
          setCategory(result.category as PublicCategory);
        }
        setViewType('item');
        return;
      }

      // Try shared collection via secure RPC
      const { data: collectionResult } = await supabase.rpc('get_shared_collection_public', {
        p_share_code: shareCode
      });

      if (collectionResult) {
        const result = collectionResult as any;
        
        // Increment view count atomically
        const { data: newCount } = await supabase.rpc('increment_shared_view_count', {
          p_share_code: shareCode,
          p_table_name: 'shared_collections'
        });
        
        setViewCount(newCount || result.shared.view_count + 1);
        setCollectionTitle(result.shared.title);
        setCollectionDescription(result.shared.description || '');
        
        if (result.category) {
          setCategory(result.category as PublicCategory);
        }
        
        if (result.items) {
          setItems(result.items as PublicItem[]);
        }

        setViewType('collection');
        return;
      }

      setViewType('not-found');
    } catch (error) {
      console.error('Error fetching public content:', error);
      setViewType('error');
    }
  };

  if (viewType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <LiquidSpinner size="lg" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (viewType === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="glass-card p-8 text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">페이지를 찾을 수 없습니다</h1>
          <p className="text-sm text-muted-foreground mb-6">
            이 공유 링크가 만료되었거나 삭제되었을 수 있습니다.
          </p>
          <Link to="/" className="glass-button px-6 py-2.5 inline-flex items-center gap-2 font-medium">
            <ArrowLeft className="h-4 w-4" />
            홈으로 가기
          </Link>
        </div>
      </div>
    );
  }

  if (viewType === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="glass-card p-8 text-center max-w-sm">
          <h1 className="text-xl font-bold text-destructive mb-2">오류가 발생했습니다</h1>
          <p className="text-sm text-muted-foreground mb-6">
            잠시 후 다시 시도해주세요.
          </p>
          <button onClick={() => window.location.reload()} className="glass-button px-6 py-2.5 font-medium">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-sheet border-b border-border/30">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
            <span className="font-bold text-foreground">PickStack</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            <span>{viewCount}</span>
          </div>
        </div>
      </header>

      {viewType === 'item' && item && (
        <SingleItemView item={item} category={category} />
      )}

      {viewType === 'collection' && (
        <CollectionView
          title={collectionTitle}
          description={collectionDescription}
          category={category}
          items={items}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onCloseDetail={() => setSelectedItem(null)}
        />
      )}

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">PickStack</Link>으로 나만의 콘텐츠를 정리하세요
        </p>
      </footer>
    </div>
  );
}

// Single Item View Component
function SingleItemView({ item, category }: { item: PublicItem; category: PublicCategory | null }) {
  const forceTextThumbnail = useMemo(() => {
    return isForceTextThumb(item.url) || isForceTextThumb(item.thumbnail_url);
  }, [item.url, item.thumbnail_url]);

  const keywords = useMemo(() => {
    return (item.tags?.length ? item.tags : fallbackKeywords(item.title)) as string[];
  }, [item.tags, item.title]);

  const formattedDate = new Date(item.created_at).toLocaleDateString('ko-KR', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });

  return (
    <main className="container py-6 px-4 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-6 relative">
        {forceTextThumbnail ? (
          <div className="w-full aspect-video">
            <TextThumbnailCard
              title={item.title}
              keywords={keywords}
              category={category?.name}
            />
          </div>
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full aspect-video object-cover" />
        ) : (
          <div className="w-full aspect-video">
            <TextThumbnailCard
              title={item.title}
              keywords={keywords}
              category={category?.name}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="glass-chip p-1">
            <PlatformIcon platform={item.platform} size="sm" />
          </div>
          {category && (
            <span 
              className="glass-chip text-2xs font-semibold px-2 py-1 flex items-center gap-1" 
              style={{ backgroundColor: `${category.color}cc`, color: 'white' }}
            >
              {category.icon} {category.name}
            </span>
          )}
        </div>
      </div>

      {/* Title & Meta */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground leading-snug mb-2">{item.title}</h1>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />{formattedDate}
        </span>
      </div>

      {/* Summary */}
      {item.summary_3lines?.filter(Boolean).length > 0 && (
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">✨ AI 요약</h3>
          <ul className="space-y-2.5">
            {item.summary_3lines.filter(Boolean).map((line, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90">
                <span className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-2xs font-bold text-white shrink-0">
                  {idx + 1}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {item.tags.map((tag) => (
            <span key={tag} className="glass-chip text-xs text-muted-foreground px-2 py-0.5">#{tag}</span>
          ))}
        </div>
      )}

      {/* External Link */}
      {item.url && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open(item.url!, '_blank')}
          className="w-full gradient-primary py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          원본 보기
        </motion.button>
      )}
    </main>
  );
}

// Collection View Component
function CollectionView({
  title,
  description,
  category,
  items,
  selectedItem,
  onSelectItem,
  onCloseDetail,
}: {
  title: string;
  description: string;
  category: PublicCategory | null;
  items: PublicItem[];
  selectedItem: PublicItem | null;
  onSelectItem: (item: PublicItem) => void;
  onCloseDetail: () => void;
}) {
  return (
    <main className="container py-6 px-4">
      {/* Collection Header */}
      <div className="glass-card p-5 mb-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: category?.color || 'hsl(var(--muted))' }}
          >
            <span className="text-2xl">{category?.icon || <FolderOpen className="h-6 w-6 text-white" />}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{items.length}개의 항목</p>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {items.map((item, index) => (
          <CollectionItemCard key={item.id} item={item} index={index} onClick={() => onSelectItem(item)} />
        ))}
      </div>

      {/* Item Detail Sheet */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onCloseDetail}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto glass-sheet rounded-t-3xl"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="p-4 pb-8">
                <SingleItemView item={selectedItem} category={category} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// Collection Item Card
function CollectionItemCard({ item, index, onClick }: { item: PublicItem; index: number; onClick: () => void }) {
  const forceTextThumbnail = useMemo(() => {
    return isForceTextThumb(item.url) || isForceTextThumb(item.thumbnail_url);
  }, [item.url, item.thumbnail_url]);

  const keywords = useMemo(() => {
    return (item.tags?.length ? item.tags : fallbackKeywords(item.title)) as string[];
  }, [item.tags, item.title]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="glass-card cursor-pointer overflow-hidden"
    >
      <div className="relative aspect-square">
        {forceTextThumbnail ? (
          <TextThumbnailCard title={item.title} keywords={keywords} />
        ) : item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <TextThumbnailCard title={item.title} keywords={keywords} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 glass-chip p-0.5">
          <PlatformIcon platform={item.platform} size="sm" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="text-xs font-bold text-white line-clamp-2">{item.title}</h3>
        </div>
      </div>
    </motion.div>
  );
}
