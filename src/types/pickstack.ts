export type SourceType = 'url' | 'text' | 'image';

export type Platform = 
  | 'Instagram' 
  | 'Threads' 
  | 'YouTube' 
  | 'TikTok' 
  | 'Facebook' 
  | 'X' 
  | 'Pinterest' 
  | 'Reddit' 
  | 'LinkedIn' 
  | 'Medium'
  | 'Naver' 
  | 'Kakao' 
  | 'Brunch' 
  | 'Web' 
  | 'Unknown';

// Custom category interface (user-created)
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string; // emoji or icon key
  keywords?: string; // comma-separated keywords for AI classification
  sort_order: number;
  created_at: string;
  is_default?: boolean; // for "기타" category
}

// Default seed categories
export const DEFAULT_CATEGORIES: Omit<CustomCategory, 'id' | 'created_at'>[] = [
  { name: '건강', color: '#10b981', icon: '💪', keywords: '운동,영양제,비타민,다이어트,헬스,루틴,건강식', sort_order: 0 },
  { name: '투자', color: '#3b82f6', icon: '📈', keywords: '주식,코인,비트코인,암호화폐,부동산,재테크,금융', sort_order: 1 },
  { name: '레시피', color: '#f97316', icon: '🍳', keywords: '요리,음식,레시피,베이킹,홈쿠킹,맛집', sort_order: 2 },
  { name: '건축', color: '#8b5cf6', icon: '🏛️', keywords: '건축,인테리어,디자인,공간,설계,리모델링', sort_order: 3 },
  { name: '렌더링', color: '#ec4899', icon: '🎨', keywords: 'D5,Lumion,SketchUp,Blender,3D,렌더링,시각화,나노바나나', sort_order: 4 },
  { name: '기타', color: '#6b7280', icon: '📁', keywords: '', sort_order: 99, is_default: true },
];

export interface SavedItem {
  id: string;
  created_at: string;
  source_type: SourceType;
  url?: string;
  title: string;
  platform: Platform;
  thumbnail_url?: string;
  summary_3lines: string[];
  tags: string[];
  category_id: string; // Changed from category string to category_id
  user_note?: string;
  ai_confidence?: number; // 0-1 confidence score
  ai_reason?: string; // AI classification reason
}

// Legacy type for backwards compatibility during transition
export type Category = 
  | '건강' 
  | '투자' 
  | '레시피' 
  | '건축' 
  | '렌더링' 
  | '기타';

export const CATEGORIES: Category[] = ['건강', '투자', '레시피', '건축', '렌더링', '기타'];

export const PLATFORMS: Platform[] = [
  'Instagram', 'Threads', 'YouTube', 'TikTok', 'Facebook', 
  'X', 'Pinterest', 'Reddit', 'LinkedIn', 'Medium',
  'Naver', 'Kakao', 'Brunch', 'Web', 'Unknown'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  '건강': 'bg-emerald-500',
  '투자': 'bg-blue-500',
  '레시피': 'bg-orange-500',
  '건축': 'bg-violet-500',
  '렌더링': 'bg-pink-500',
  '기타': 'bg-gray-500',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  'Instagram': 'platform-instagram',
  'Threads': 'platform-instagram',
  'YouTube': 'platform-youtube',
  'TikTok': 'platform-tiktok',
  'Facebook': 'platform-facebook',
  'X': 'platform-twitter',
  'Pinterest': 'platform-pinterest',
  'Reddit': 'platform-youtube',
  'LinkedIn': 'platform-facebook',
  'Medium': 'platform-web',
  'Naver': 'platform-naver',
  'Kakao': 'platform-recipe',
  'Brunch': 'platform-naver',
  'Web': 'platform-web',
  'Unknown': 'platform-web',
};

// AI Classification types
export interface ClassificationResult {
  category_id: string;
  confidence: number;
  top3_candidates: { category_id: string; score: number }[];
  reason: string;
}
