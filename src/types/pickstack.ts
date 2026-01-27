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

export type Category = 
  | '건강' 
  | '투자' 
  | '레시피' 
  | '건축' 
  | '렌더링' 
  | '기타';

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
  category: Category;
  user_note?: string;
}

export const CATEGORIES: Category[] = ['건강', '투자', '레시피', '건축', '렌더링', '기타'];

export const PLATFORMS: Platform[] = [
  'Instagram', 'Threads', 'YouTube', 'TikTok', 'Facebook', 
  'X', 'Pinterest', 'Reddit', 'LinkedIn', 'Medium',
  'Naver', 'Kakao', 'Brunch', 'Web', 'Unknown'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  '건강': 'category-health',
  '투자': 'category-investment',
  '레시피': 'category-recipe',
  '건축': 'category-architecture',
  '렌더링': 'category-rendering',
  '기타': 'category-other',
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
