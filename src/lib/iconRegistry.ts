/**
 * Icon Registry System
 * 
 * Icons are stored as string keys in the database:
 * - "lucide:Heart" - Lucide icons
 * - "emoji:🍜" - Emoji icons
 * 
 * This allows design/library changes without breaking data.
 */

import { icons, LucideIcon } from 'lucide-react';

// Type for the icons object
type IconsType = typeof icons;

// Icon categories for filtering
export type IconCategory = 
  | 'all' 
  | 'recommended' 
  | 'brand' 
  | 'food' 
  | 'money' 
  | 'study' 
  | 'travel' 
  | 'health' 
  | 'work' 
  | 'hobby';

export interface IconItem {
  key: string; // e.g., "lucide:Heart", "emoji:🍜"
  name: string; // Display name for search
  keywords: string[]; // Search keywords
  category: IconCategory[];
}

// Lucide icons organized by category
const LUCIDE_ICONS: { name: string; categories: IconCategory[]; keywords: string[] }[] = [
  // Health & Fitness
  { name: 'Heart', categories: ['health', 'recommended'], keywords: ['건강', 'health', 'love', '사랑', '하트'] },
  { name: 'HeartPulse', categories: ['health'], keywords: ['심장', 'heart', 'pulse', '맥박', '건강'] },
  { name: 'Activity', categories: ['health'], keywords: ['활동', 'activity', '운동', 'fitness'] },
  { name: 'Dumbbell', categories: ['health', 'recommended'], keywords: ['운동', 'gym', '헬스', 'workout', '덤벨'] },
  { name: 'Bike', categories: ['health', 'travel'], keywords: ['자전거', 'bike', 'cycling', '사이클'] },
  { name: 'Footprints', categories: ['health', 'travel'], keywords: ['걷기', 'walk', 'steps', '발자국'] },
  { name: 'Apple', categories: ['health', 'food'], keywords: ['사과', 'apple', '과일', 'fruit', '영양'] },
  { name: 'Pill', categories: ['health'], keywords: ['약', 'pill', '영양제', 'vitamin', '비타민'] },
  { name: 'Stethoscope', categories: ['health'], keywords: ['병원', 'doctor', '의사', 'medical'] },
  { name: 'Brain', categories: ['health', 'study'], keywords: ['뇌', 'brain', '정신', 'mental', '공부'] },
  
  // Food & Recipe
  { name: 'ChefHat', categories: ['food', 'recommended'], keywords: ['요리', 'chef', 'cook', '요리사', '셰프'] },
  { name: 'UtensilsCrossed', categories: ['food', 'recommended'], keywords: ['식사', 'meal', 'restaurant', '레스토랑', '맛집'] },
  { name: 'Pizza', categories: ['food'], keywords: ['피자', 'pizza', '음식', 'food'] },
  { name: 'Coffee', categories: ['food'], keywords: ['커피', 'coffee', 'cafe', '카페'] },
  { name: 'Wine', categories: ['food'], keywords: ['와인', 'wine', '술', 'drink'] },
  { name: 'Beer', categories: ['food'], keywords: ['맥주', 'beer', '술', 'drink'] },
  { name: 'Cake', categories: ['food'], keywords: ['케이크', 'cake', '디저트', 'dessert', '베이킹'] },
  { name: 'Cookie', categories: ['food'], keywords: ['쿠키', 'cookie', '베이킹', 'baking'] },
  { name: 'Sandwich', categories: ['food'], keywords: ['샌드위치', 'sandwich', '간식'] },
  { name: 'Soup', categories: ['food'], keywords: ['수프', 'soup', '국', '찌개'] },
  { name: 'Salad', categories: ['food'], keywords: ['샐러드', 'salad', '채소', 'vegetable'] },
  { name: 'IceCream', categories: ['food'], keywords: ['아이스크림', 'ice cream', '디저트'] },
  { name: 'Croissant', categories: ['food'], keywords: ['크로와상', 'croissant', '빵', 'bread', '베이킹'] },
  
  // Money & Investment
  { name: 'TrendingUp', categories: ['money', 'recommended'], keywords: ['투자', 'invest', 'stock', '주식', '상승'] },
  { name: 'TrendingDown', categories: ['money'], keywords: ['하락', 'down', 'stock', '주식'] },
  { name: 'DollarSign', categories: ['money'], keywords: ['돈', 'money', 'dollar', '달러', '재테크'] },
  { name: 'Coins', categories: ['money'], keywords: ['코인', 'coin', '암호화폐', 'crypto', '비트코인'] },
  { name: 'Wallet', categories: ['money'], keywords: ['지갑', 'wallet', '돈', 'money'] },
  { name: 'PiggyBank', categories: ['money', 'recommended'], keywords: ['저축', 'savings', '저금통', '재테크'] },
  { name: 'Landmark', categories: ['money'], keywords: ['은행', 'bank', '금융', 'finance'] },
  { name: 'Receipt', categories: ['money'], keywords: ['영수증', 'receipt', '가계부', 'expense'] },
  { name: 'CreditCard', categories: ['money'], keywords: ['카드', 'card', '결제', 'payment'] },
  { name: 'BarChart3', categories: ['money', 'work'], keywords: ['차트', 'chart', '분석', 'analysis'] },
  { name: 'LineChart', categories: ['money'], keywords: ['차트', 'chart', '그래프', 'graph'] },
  { name: 'PieChart', categories: ['money'], keywords: ['차트', 'pie chart', '분석'] },
  
  // Study & Learning
  { name: 'BookOpen', categories: ['study', 'recommended'], keywords: ['책', 'book', '공부', 'study', '독서'] },
  { name: 'GraduationCap', categories: ['study', 'recommended'], keywords: ['졸업', 'graduation', '학습', 'education'] },
  { name: 'Lightbulb', categories: ['study', 'recommended'], keywords: ['아이디어', 'idea', '영감', 'inspiration'] },
  { name: 'PenTool', categories: ['study', 'hobby'], keywords: ['펜', 'pen', '필기', 'write', '디자인'] },
  { name: 'FileText', categories: ['study', 'work'], keywords: ['문서', 'document', '노트', 'note'] },
  { name: 'Notebook', categories: ['study'], keywords: ['노트', 'notebook', '필기', '메모'] },
  { name: 'Library', categories: ['study'], keywords: ['도서관', 'library', '책', 'book'] },
  { name: 'Languages', categories: ['study'], keywords: ['언어', 'language', '외국어', '영어'] },
  { name: 'Calculator', categories: ['study', 'work'], keywords: ['계산기', 'calculator', '수학', 'math'] },
  { name: 'Microscope', categories: ['study'], keywords: ['과학', 'science', '연구', 'research'] },
  { name: 'Atom', categories: ['study'], keywords: ['과학', 'science', '원자', 'atom'] },
  
  // Travel & Places
  { name: 'Plane', categories: ['travel', 'recommended'], keywords: ['비행기', 'plane', '여행', 'travel', '해외'] },
  { name: 'Map', categories: ['travel', 'recommended'], keywords: ['지도', 'map', '여행', 'travel', '핫플'] },
  { name: 'MapPin', categories: ['travel'], keywords: ['위치', 'location', '장소', 'place', '핫플'] },
  { name: 'Compass', categories: ['travel'], keywords: ['나침반', 'compass', '탐험', 'explore'] },
  { name: 'Mountain', categories: ['travel', 'hobby'], keywords: ['산', 'mountain', '등산', 'hiking'] },
  { name: 'Palmtree', categories: ['travel'], keywords: ['야자수', 'palm', '휴양', 'vacation', '바캉스'] },
  { name: 'Tent', categories: ['travel', 'hobby'], keywords: ['캠핑', 'camping', 'tent', '텐트'] },
  { name: 'Car', categories: ['travel'], keywords: ['자동차', 'car', '드라이브', 'drive'] },
  { name: 'Train', categories: ['travel'], keywords: ['기차', 'train', 'KTX', '여행'] },
  { name: 'Ship', categories: ['travel'], keywords: ['배', 'ship', '크루즈', 'cruise'] },
  { name: 'Hotel', categories: ['travel'], keywords: ['호텔', 'hotel', '숙소', 'accommodation'] },
  { name: 'Camera', categories: ['travel', 'hobby'], keywords: ['카메라', 'camera', '사진', 'photo'] },
  { name: 'Luggage', categories: ['travel'], keywords: ['캐리어', 'luggage', '여행', 'travel'] },
  
  // Work & Productivity
  { name: 'Briefcase', categories: ['work', 'recommended'], keywords: ['업무', 'work', 'business', '비즈니스'] },
  { name: 'Calendar', categories: ['work', 'recommended'], keywords: ['일정', 'calendar', 'schedule', '스케줄'] },
  { name: 'Clock', categories: ['work'], keywords: ['시간', 'time', 'clock', '루틴'] },
  { name: 'Target', categories: ['work', 'recommended'], keywords: ['목표', 'goal', 'target', '타겟'] },
  { name: 'CheckSquare', categories: ['work'], keywords: ['체크', 'check', 'todo', '할일'] },
  { name: 'ListTodo', categories: ['work'], keywords: ['할일', 'todo', 'list', '목록'] },
  { name: 'FolderOpen', categories: ['work'], keywords: ['폴더', 'folder', '파일', 'file'] },
  { name: 'Mail', categories: ['work'], keywords: ['메일', 'mail', 'email', '이메일'] },
  { name: 'MessageSquare', categories: ['work'], keywords: ['메시지', 'message', '채팅', 'chat'] },
  { name: 'Users', categories: ['work'], keywords: ['팀', 'team', '사람들', 'people', '협업'] },
  { name: 'Building2', categories: ['work'], keywords: ['회사', 'company', '빌딩', 'building'] },
  { name: 'Presentation', categories: ['work'], keywords: ['발표', 'presentation', 'ppt', '프레젠테이션'] },
  { name: 'Kanban', categories: ['work'], keywords: ['칸반', 'kanban', '프로젝트', 'project'] },
  
  // Hobbies
  { name: 'Gamepad2', categories: ['hobby', 'recommended'], keywords: ['게임', 'game', '취미', 'hobby'] },
  { name: 'Music', categories: ['hobby', 'recommended'], keywords: ['음악', 'music', '노래', 'song'] },
  { name: 'Headphones', categories: ['hobby'], keywords: ['헤드폰', 'headphone', '음악', 'music'] },
  { name: 'Palette', categories: ['hobby', 'recommended'], keywords: ['그림', 'art', '예술', '팔레트', '디자인'] },
  { name: 'Brush', categories: ['hobby'], keywords: ['그림', 'paint', 'brush', '붓'] },
  { name: 'Film', categories: ['hobby'], keywords: ['영화', 'movie', 'film', '영상'] },
  { name: 'Clapperboard', categories: ['hobby'], keywords: ['영화', 'movie', '편집', 'video'] },
  { name: 'Tv', categories: ['hobby'], keywords: ['TV', '드라마', '영상', 'video'] },
  { name: 'Youtube', categories: ['hobby', 'brand'], keywords: ['유튜브', 'youtube', '영상', 'video'] },
  { name: 'Instagram', categories: ['hobby', 'brand'], keywords: ['인스타', 'instagram', 'sns', '소셜'] },
  { name: 'Twitter', categories: ['hobby', 'brand'], keywords: ['트위터', 'twitter', 'X', 'sns'] },
  { name: 'Twitch', categories: ['hobby', 'brand'], keywords: ['트위치', 'twitch', '스트리밍', 'stream'] },
  { name: 'Guitar', categories: ['hobby'], keywords: ['기타', 'guitar', '악기', 'instrument'] },
  { name: 'Volleyball', categories: ['hobby', 'health'], keywords: ['배구', 'volleyball', '스포츠', 'sports'] },
  { name: 'Trophy', categories: ['hobby'], keywords: ['트로피', 'trophy', '우승', 'win'] },
  { name: 'Puzzle', categories: ['hobby'], keywords: ['퍼즐', 'puzzle', '게임', 'game'] },
  
  // Home & Life
  { name: 'Home', categories: ['recommended'], keywords: ['집', 'home', '홈', '가정'] },
  { name: 'Sofa', categories: ['hobby'], keywords: ['소파', 'sofa', '인테리어', 'interior'] },
  { name: 'Lamp', categories: ['hobby'], keywords: ['램프', 'lamp', '조명', 'light', '인테리어'] },
  { name: 'Bed', categories: ['hobby'], keywords: ['침대', 'bed', '수면', 'sleep'] },
  { name: 'Bath', categories: ['hobby', 'health'], keywords: ['욕실', 'bath', '목욕', '힐링'] },
  { name: 'Baby', categories: ['hobby'], keywords: ['아기', 'baby', '육아', 'parenting'] },
  { name: 'Dog', categories: ['hobby'], keywords: ['강아지', 'dog', '반려동물', 'pet'] },
  { name: 'Cat', categories: ['hobby'], keywords: ['고양이', 'cat', '반려동물', 'pet'] },
  { name: 'Flower', categories: ['hobby'], keywords: ['꽃', 'flower', '식물', 'plant'] },
  { name: 'TreeDeciduous', categories: ['hobby'], keywords: ['나무', 'tree', '자연', 'nature'] },
  
  // Tech & Creative
  { name: 'Laptop', categories: ['work', 'hobby'], keywords: ['노트북', 'laptop', '컴퓨터', 'computer'] },
  { name: 'Smartphone', categories: ['work', 'hobby'], keywords: ['스마트폰', 'phone', '핸드폰', 'mobile'] },
  { name: 'Code', categories: ['work'], keywords: ['코딩', 'code', '프로그래밍', 'programming'] },
  { name: 'Terminal', categories: ['work'], keywords: ['터미널', 'terminal', '개발', 'dev'] },
  { name: 'Cpu', categories: ['work'], keywords: ['CPU', '컴퓨터', 'computer', '하드웨어'] },
  { name: 'Sparkles', categories: ['recommended'], keywords: ['AI', '인공지능', 'magic', '스파클', '추천'] },
  { name: 'Wand2', categories: ['recommended'], keywords: ['AI', '마법', 'magic', '자동화'] },
  { name: 'Bot', categories: ['work'], keywords: ['봇', 'bot', 'AI', '자동화'] },
  { name: 'Layers', categories: ['work'], keywords: ['레이어', 'layers', '디자인', 'design'] },
  { name: 'PenLine', categories: ['work'], keywords: ['편집', 'edit', '작성', 'write'] },
  { name: 'Scissors', categories: ['work'], keywords: ['가위', 'scissors', '편집', 'cut'] },
  { name: 'Video', categories: ['hobby', 'work'], keywords: ['비디오', 'video', '영상', '촬영'] },
  { name: 'Mic', categories: ['hobby', 'work'], keywords: ['마이크', 'mic', '녹음', 'record', '팟캐스트'] },
  
  // Architecture & Design (Creator focused)
  { name: 'Building', categories: ['work', 'recommended'], keywords: ['건축', 'architecture', '빌딩', 'building'] },
  { name: 'Ruler', categories: ['work'], keywords: ['자', 'ruler', '설계', 'design'] },
  { name: 'Pencil', categories: ['work', 'study'], keywords: ['연필', 'pencil', '드로잉', 'drawing'] },
  { name: 'Shapes', categories: ['work'], keywords: ['도형', 'shapes', '디자인', 'design'] },
  { name: 'Grid3X3', categories: ['work'], keywords: ['그리드', 'grid', '레이아웃', 'layout'] },
  { name: 'Box', categories: ['work'], keywords: ['박스', 'box', '3D', '모델링'] },
  { name: 'Boxes', categories: ['work'], keywords: ['박스', 'boxes', '3D', '렌더링'] },
  { name: 'Move3D', categories: ['work'], keywords: ['3D', '이동', 'move', '모델링'] },
  { name: 'Scan', categories: ['work'], keywords: ['스캔', 'scan', '렌더링', 'render'] },
  { name: 'Frame', categories: ['work'], keywords: ['프레임', 'frame', '레퍼런스', 'reference'] },
  { name: 'Image', categories: ['work', 'hobby'], keywords: ['이미지', 'image', '사진', 'photo'] },
  { name: 'Images', categories: ['work'], keywords: ['이미지', 'images', '레퍼런스', 'reference'] },
  { name: 'Aperture', categories: ['hobby'], keywords: ['조리개', 'aperture', '사진', 'photo'] },
  { name: 'Focus', categories: ['work'], keywords: ['포커스', 'focus', '집중'] },
  
  // Shopping
  { name: 'ShoppingBag', categories: ['hobby', 'recommended'], keywords: ['쇼핑', 'shopping', '구매', 'buy'] },
  { name: 'ShoppingCart', categories: ['hobby'], keywords: ['카트', 'cart', '쇼핑', 'shopping'] },
  { name: 'Gift', categories: ['hobby'], keywords: ['선물', 'gift', '기프트'] },
  { name: 'Tag', categories: ['money'], keywords: ['태그', 'tag', '할인', 'sale'] },
  { name: 'Percent', categories: ['money'], keywords: ['퍼센트', 'percent', '할인', 'discount'] },
  { name: 'Package', categories: ['hobby'], keywords: ['패키지', 'package', '배송', 'delivery'] },
  
  // News & Info
  { name: 'Newspaper', categories: ['study', 'recommended'], keywords: ['뉴스', 'news', '신문', 'newspaper'] },
  { name: 'Rss', categories: ['study'], keywords: ['RSS', '피드', 'feed', '뉴스'] },
  { name: 'Bell', categories: ['work'], keywords: ['알림', 'notification', 'bell', '벨'] },
  { name: 'Info', categories: ['study'], keywords: ['정보', 'info', 'information'] },
  { name: 'HelpCircle', categories: ['study'], keywords: ['도움', 'help', '질문', 'question'] },
  { name: 'AlertCircle', categories: ['work'], keywords: ['주의', 'alert', '경고', 'warning'] },
  
  // Misc useful
  { name: 'Star', categories: ['recommended'], keywords: ['별', 'star', '즐겨찾기', 'favorite'] },
  { name: 'Bookmark', categories: ['recommended'], keywords: ['북마크', 'bookmark', '저장', 'save'] },
  { name: 'Heart', categories: ['recommended'], keywords: ['하트', 'heart', '좋아요', 'like'] },
  { name: 'ThumbsUp', categories: ['recommended'], keywords: ['좋아요', 'like', 'thumbs up'] },
  { name: 'Zap', categories: ['recommended'], keywords: ['번개', 'zap', '빠른', 'fast', '에너지'] },
  { name: 'Flame', categories: ['recommended'], keywords: ['불', 'flame', '핫', 'hot', '트렌드'] },
  { name: 'Rocket', categories: ['recommended'], keywords: ['로켓', 'rocket', '성장', 'growth'] },
  { name: 'Crown', categories: ['recommended'], keywords: ['왕관', 'crown', '프리미엄', 'premium'] },
  { name: 'Award', categories: ['recommended'], keywords: ['상', 'award', '수상', 'prize'] },
  { name: 'Medal', categories: ['hobby'], keywords: ['메달', 'medal', '수상', 'prize'] },
  { name: 'Flag', categories: ['work'], keywords: ['깃발', 'flag', '목표', 'goal'] },
  { name: 'Hash', categories: ['hobby'], keywords: ['해시', 'hash', '태그', 'hashtag'] },
  { name: 'Link', categories: ['work'], keywords: ['링크', 'link', 'URL', '연결'] },
  { name: 'Share2', categories: ['work'], keywords: ['공유', 'share', '공유하기'] },
  { name: 'Download', categories: ['work'], keywords: ['다운로드', 'download', '저장'] },
  { name: 'Upload', categories: ['work'], keywords: ['업로드', 'upload', '올리기'] },
  { name: 'RefreshCw', categories: ['work'], keywords: ['새로고침', 'refresh', '갱신'] },
  { name: 'Settings', categories: ['work'], keywords: ['설정', 'settings', '환경설정'] },
  { name: 'Sliders', categories: ['work'], keywords: ['슬라이더', 'sliders', '조정', 'adjust'] },
  { name: 'Filter', categories: ['work'], keywords: ['필터', 'filter', '분류'] },
  { name: 'Search', categories: ['work'], keywords: ['검색', 'search', '찾기'] },
  { name: 'Eye', categories: ['work'], keywords: ['눈', 'eye', '보기', 'view'] },
  { name: 'Lock', categories: ['work'], keywords: ['잠금', 'lock', '보안', 'security'] },
  { name: 'Unlock', categories: ['work'], keywords: ['잠금해제', 'unlock', '열기'] },
  { name: 'Key', categories: ['work'], keywords: ['열쇠', 'key', '키', '비밀번호'] },
  { name: 'FolderHeart', categories: ['recommended'], keywords: ['폴더', 'folder', '즐겨찾기', '모음'] },
  { name: 'Archive', categories: ['work'], keywords: ['아카이브', 'archive', '저장소'] },
  { name: 'Inbox', categories: ['work'], keywords: ['받은편지함', 'inbox', '메일'] },
  { name: 'Send', categories: ['work'], keywords: ['보내기', 'send', '전송'] },
  { name: 'Globe', categories: ['travel', 'work'], keywords: ['지구', 'globe', '웹', 'web', '세계'] },
  { name: 'Wifi', categories: ['work'], keywords: ['와이파이', 'wifi', '인터넷', 'internet'] },
  { name: 'Cloud', categories: ['work'], keywords: ['클라우드', 'cloud', '저장', 'storage'] },
  { name: 'Sun', categories: ['hobby'], keywords: ['태양', 'sun', '날씨', 'weather'] },
  { name: 'Moon', categories: ['hobby'], keywords: ['달', 'moon', '밤', 'night'] },
  { name: 'CloudRain', categories: ['hobby'], keywords: ['비', 'rain', '날씨', 'weather'] },
  { name: 'Snowflake', categories: ['hobby'], keywords: ['눈', 'snow', '겨울', 'winter'] },
  { name: 'Umbrella', categories: ['hobby'], keywords: ['우산', 'umbrella', '비', 'rain'] },
  { name: 'ThermometerSun', categories: ['health', 'hobby'], keywords: ['온도', 'temperature', '날씨'] },
];

// Common emojis organized by category
const EMOJI_ICONS: { emoji: string; name: string; categories: IconCategory[]; keywords: string[] }[] = [
  // Health
  { emoji: '💪', name: '근육', categories: ['health', 'recommended'], keywords: ['운동', 'workout', '헬스'] },
  { emoji: '🏃', name: '달리기', categories: ['health'], keywords: ['러닝', 'running', '운동'] },
  { emoji: '🧘', name: '요가', categories: ['health'], keywords: ['요가', 'yoga', '명상'] },
  { emoji: '🏋️', name: '역도', categories: ['health'], keywords: ['웨이트', 'weight', '헬스'] },
  { emoji: '💊', name: '영양제', categories: ['health'], keywords: ['비타민', 'vitamin', '약'] },
  { emoji: '🩺', name: '의료', categories: ['health'], keywords: ['병원', 'hospital', '건강'] },
  { emoji: '🧬', name: 'DNA', categories: ['health', 'study'], keywords: ['유전자', 'gene', '과학'] },
  { emoji: '🦷', name: '치아', categories: ['health'], keywords: ['치과', 'dental', '양치'] },
  { emoji: '👁️', name: '눈', categories: ['health'], keywords: ['시력', 'eye', '눈건강'] },
  { emoji: '🧠', name: '뇌', categories: ['health', 'study'], keywords: ['정신', 'brain', '두뇌'] },
  
  // Food
  { emoji: '🍳', name: '요리', categories: ['food', 'recommended'], keywords: ['cooking', '프라이팬', '아침'] },
  { emoji: '🍜', name: '국수', categories: ['food', 'recommended'], keywords: ['면', 'noodle', '라면'] },
  { emoji: '🍕', name: '피자', categories: ['food'], keywords: ['pizza', '패스트푸드'] },
  { emoji: '🍔', name: '햄버거', categories: ['food'], keywords: ['burger', '패스트푸드'] },
  { emoji: '🍣', name: '초밥', categories: ['food'], keywords: ['sushi', '일식', '회'] },
  { emoji: '🍱', name: '도시락', categories: ['food'], keywords: ['bento', '점심'] },
  { emoji: '🥗', name: '샐러드', categories: ['food', 'health'], keywords: ['salad', '다이어트'] },
  { emoji: '🍰', name: '케이크', categories: ['food'], keywords: ['cake', '디저트', '베이킹'] },
  { emoji: '☕', name: '커피', categories: ['food', 'recommended'], keywords: ['coffee', '카페'] },
  { emoji: '🍷', name: '와인', categories: ['food'], keywords: ['wine', '술'] },
  { emoji: '🥤', name: '음료', categories: ['food'], keywords: ['drink', '음료수'] },
  { emoji: '🧁', name: '컵케이크', categories: ['food'], keywords: ['cupcake', '베이킹'] },
  { emoji: '🥐', name: '빵', categories: ['food'], keywords: ['bread', '베이커리'] },
  { emoji: '🥑', name: '아보카도', categories: ['food', 'health'], keywords: ['avocado', '건강식'] },
  { emoji: '🍲', name: '찌개', categories: ['food'], keywords: ['stew', '한식'] },
  
  // Money
  { emoji: '📈', name: '상승', categories: ['money', 'recommended'], keywords: ['투자', 'invest', '주식'] },
  { emoji: '📊', name: '차트', categories: ['money', 'work'], keywords: ['chart', '분석'] },
  { emoji: '💰', name: '돈', categories: ['money', 'recommended'], keywords: ['money', '재테크'] },
  { emoji: '💵', name: '달러', categories: ['money'], keywords: ['dollar', '외화'] },
  { emoji: '💳', name: '카드', categories: ['money'], keywords: ['card', '결제'] },
  { emoji: '🏦', name: '은행', categories: ['money'], keywords: ['bank', '금융'] },
  { emoji: '💎', name: '다이아', categories: ['money'], keywords: ['diamond', '보석', '가치'] },
  { emoji: '🪙', name: '코인', categories: ['money'], keywords: ['coin', '암호화폐', '비트코인'] },
  
  // Study
  { emoji: '📚', name: '책', categories: ['study', 'recommended'], keywords: ['book', '독서', '공부'] },
  { emoji: '📖', name: '펼친책', categories: ['study'], keywords: ['reading', '독서'] },
  { emoji: '📝', name: '메모', categories: ['study', 'work'], keywords: ['memo', '필기', '노트'] },
  { emoji: '✏️', name: '연필', categories: ['study'], keywords: ['pencil', '필기'] },
  { emoji: '🎓', name: '학사모', categories: ['study', 'recommended'], keywords: ['graduation', '졸업'] },
  { emoji: '💡', name: '아이디어', categories: ['study', 'recommended'], keywords: ['idea', '영감'] },
  { emoji: '🔬', name: '현미경', categories: ['study'], keywords: ['science', '과학', '연구'] },
  { emoji: '🧪', name: '실험', categories: ['study'], keywords: ['experiment', '과학'] },
  { emoji: '📐', name: '삼각자', categories: ['study', 'work'], keywords: ['ruler', '설계'] },
  { emoji: '🔢', name: '숫자', categories: ['study'], keywords: ['number', '수학'] },
  { emoji: '🌐', name: '언어', categories: ['study'], keywords: ['language', '외국어'] },
  
  // Travel
  { emoji: '✈️', name: '비행기', categories: ['travel', 'recommended'], keywords: ['airplane', '해외여행'] },
  { emoji: '🗺️', name: '지도', categories: ['travel', 'recommended'], keywords: ['map', '여행'] },
  { emoji: '🏝️', name: '섬', categories: ['travel'], keywords: ['island', '휴양'] },
  { emoji: '🏔️', name: '산', categories: ['travel', 'hobby'], keywords: ['mountain', '등산'] },
  { emoji: '🏕️', name: '캠핑', categories: ['travel', 'hobby'], keywords: ['camping', '텐트'] },
  { emoji: '🚗', name: '자동차', categories: ['travel'], keywords: ['car', '드라이브'] },
  { emoji: '🚅', name: 'KTX', categories: ['travel'], keywords: ['train', '기차'] },
  { emoji: '🛳️', name: '크루즈', categories: ['travel'], keywords: ['cruise', '배'] },
  { emoji: '🎢', name: '놀이공원', categories: ['travel', 'hobby'], keywords: ['theme park', '어트랙션'] },
  { emoji: '🏰', name: '성', categories: ['travel'], keywords: ['castle', '관광'] },
  { emoji: '🗼', name: '타워', categories: ['travel'], keywords: ['tower', '랜드마크'] },
  { emoji: '📸', name: '사진', categories: ['travel', 'hobby'], keywords: ['photo', '촬영'] },
  
  // Work
  { emoji: '💼', name: '서류가방', categories: ['work', 'recommended'], keywords: ['briefcase', '비즈니스'] },
  { emoji: '🗓️', name: '달력', categories: ['work', 'recommended'], keywords: ['calendar', '일정'] },
  { emoji: '⏰', name: '알람', categories: ['work'], keywords: ['alarm', '시간', '루틴'] },
  { emoji: '📋', name: '클립보드', categories: ['work'], keywords: ['clipboard', '체크리스트'] },
  { emoji: '📁', name: '폴더', categories: ['work', 'recommended'], keywords: ['folder', '파일'] },
  { emoji: '📌', name: '핀', categories: ['work'], keywords: ['pin', '고정'] },
  { emoji: '🎯', name: '타겟', categories: ['work', 'recommended'], keywords: ['target', '목표'] },
  { emoji: '✅', name: '체크', categories: ['work'], keywords: ['check', '완료'] },
  { emoji: '📧', name: '이메일', categories: ['work'], keywords: ['email', '메일'] },
  { emoji: '💬', name: '말풍선', categories: ['work'], keywords: ['chat', '대화'] },
  { emoji: '👥', name: '사람들', categories: ['work'], keywords: ['people', '팀', '협업'] },
  { emoji: '🏢', name: '빌딩', categories: ['work'], keywords: ['building', '회사'] },
  { emoji: '📊', name: '프레젠테이션', categories: ['work'], keywords: ['presentation', '발표'] },
  
  // Hobby
  { emoji: '🎮', name: '게임', categories: ['hobby', 'recommended'], keywords: ['game', '취미'] },
  { emoji: '🎵', name: '음악', categories: ['hobby', 'recommended'], keywords: ['music', '노래'] },
  { emoji: '🎧', name: '헤드폰', categories: ['hobby'], keywords: ['headphone', '음악'] },
  { emoji: '🎨', name: '팔레트', categories: ['hobby', 'recommended'], keywords: ['art', '그림', '디자인'] },
  { emoji: '🖼️', name: '액자', categories: ['hobby'], keywords: ['frame', '그림', '전시'] },
  { emoji: '🎬', name: '영화', categories: ['hobby', 'recommended'], keywords: ['movie', '영상'] },
  { emoji: '📺', name: 'TV', categories: ['hobby'], keywords: ['tv', '드라마'] },
  { emoji: '📱', name: '스마트폰', categories: ['hobby', 'work'], keywords: ['phone', '앱'] },
  { emoji: '💻', name: '노트북', categories: ['hobby', 'work'], keywords: ['laptop', '컴퓨터'] },
  { emoji: '🎹', name: '피아노', categories: ['hobby'], keywords: ['piano', '악기'] },
  { emoji: '🎸', name: '기타', categories: ['hobby'], keywords: ['guitar', '악기'] },
  { emoji: '⚽', name: '축구', categories: ['hobby', 'health'], keywords: ['soccer', '스포츠'] },
  { emoji: '🏀', name: '농구', categories: ['hobby', 'health'], keywords: ['basketball', '스포츠'] },
  { emoji: '🏆', name: '트로피', categories: ['hobby'], keywords: ['trophy', '우승'] },
  { emoji: '🧩', name: '퍼즐', categories: ['hobby'], keywords: ['puzzle', '게임'] },
  { emoji: '🎭', name: '공연', categories: ['hobby'], keywords: ['theater', '연극', '뮤지컬'] },
  
  // Home & Life
  { emoji: '🏠', name: '집', categories: ['recommended'], keywords: ['home', '가정'] },
  { emoji: '🛋️', name: '소파', categories: ['hobby'], keywords: ['sofa', '인테리어'] },
  { emoji: '🪴', name: '화분', categories: ['hobby'], keywords: ['plant', '식물'] },
  { emoji: '🛏️', name: '침대', categories: ['hobby'], keywords: ['bed', '수면'] },
  { emoji: '🧸', name: '인형', categories: ['hobby'], keywords: ['teddy', '육아'] },
  { emoji: '👶', name: '아기', categories: ['hobby'], keywords: ['baby', '육아'] },
  { emoji: '🐕', name: '강아지', categories: ['hobby'], keywords: ['dog', '반려동물'] },
  { emoji: '🐈', name: '고양이', categories: ['hobby'], keywords: ['cat', '반려동물'] },
  { emoji: '🌸', name: '꽃', categories: ['hobby'], keywords: ['flower', '식물'] },
  { emoji: '🌳', name: '나무', categories: ['hobby'], keywords: ['tree', '자연'] },
  
  // Tech & AI
  { emoji: '🤖', name: 'AI', categories: ['work', 'recommended'], keywords: ['robot', 'AI', '인공지능'] },
  { emoji: '✨', name: '스파클', categories: ['recommended'], keywords: ['sparkle', 'magic', 'AI'] },
  { emoji: '🔮', name: '수정구', categories: ['hobby'], keywords: ['crystal', '예측'] },
  { emoji: '⚡', name: '번개', categories: ['recommended'], keywords: ['lightning', '빠른', '에너지'] },
  { emoji: '🔥', name: '불', categories: ['recommended'], keywords: ['fire', '핫', '트렌드'] },
  { emoji: '🚀', name: '로켓', categories: ['recommended'], keywords: ['rocket', '성장'] },
  { emoji: '👑', name: '왕관', categories: ['recommended'], keywords: ['crown', '프리미엄'] },
  { emoji: '🏅', name: '메달', categories: ['hobby'], keywords: ['medal', '수상'] },
  { emoji: '⭐', name: '별', categories: ['recommended'], keywords: ['star', '즐겨찾기'] },
  { emoji: '🔖', name: '북마크', categories: ['recommended'], keywords: ['bookmark', '저장'] },
  { emoji: '❤️', name: '하트', categories: ['recommended'], keywords: ['heart', '좋아요'] },
  { emoji: '👍', name: '좋아요', categories: ['recommended'], keywords: ['like', '추천'] },
  { emoji: '🔗', name: '링크', categories: ['work'], keywords: ['link', '연결'] },
  { emoji: '🏛️', name: '건축', categories: ['work', 'recommended'], keywords: ['architecture', '건물'] },
  { emoji: '🖌️', name: '붓', categories: ['hobby', 'work'], keywords: ['brush', '그림', '디자인'] },
  { emoji: '🎞️', name: '필름', categories: ['hobby', 'work'], keywords: ['film', '영상', '편집'] },
  { emoji: '📡', name: '안테나', categories: ['work'], keywords: ['antenna', '통신', '뉴스'] },
  { emoji: '📰', name: '신문', categories: ['study'], keywords: ['newspaper', '뉴스'] },
  { emoji: '🔔', name: '벨', categories: ['work'], keywords: ['bell', '알림'] },
  { emoji: '❓', name: '물음표', categories: ['study'], keywords: ['question', '질문'] },
  { emoji: '💝', name: '선물하트', categories: ['hobby'], keywords: ['gift', '선물'] },
  { emoji: '🎁', name: '선물', categories: ['hobby'], keywords: ['gift', '기프트'] },
  { emoji: '🛒', name: '카트', categories: ['hobby'], keywords: ['cart', '쇼핑'] },
  { emoji: '👜', name: '가방', categories: ['hobby', 'recommended'], keywords: ['bag', '쇼핑'] },
  { emoji: '📦', name: '박스', categories: ['hobby', 'work'], keywords: ['box', '배송'] },
];

// Build the icon registry
function buildIconRegistry(): IconItem[] {
  const items: IconItem[] = [];

  // Add Lucide icons
  for (const icon of LUCIDE_ICONS) {
    items.push({
      key: `lucide:${icon.name}`,
      name: icon.name,
      keywords: icon.keywords,
      category: icon.categories,
    });
  }

  // Add Emoji icons
  for (const emoji of EMOJI_ICONS) {
    items.push({
      key: `emoji:${emoji.emoji}`,
      name: emoji.name,
      keywords: emoji.keywords,
      category: emoji.categories,
    });
  }

  return items;
}

export const ICON_REGISTRY = buildIconRegistry();

// Category filter labels
export const ICON_CATEGORY_LABELS: Record<IconCategory, string> = {
  all: '전체',
  recommended: '추천',
  brand: '브랜드',
  food: '음식',
  money: '돈',
  study: '공부',
  travel: '여행',
  health: '건강',
  work: '업무',
  hobby: '취미',
};

// Search icons by query and category
export function searchIcons(query: string, category: IconCategory = 'all'): IconItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  let filtered = ICON_REGISTRY;
  
  // Filter by category
  if (category !== 'all') {
    filtered = filtered.filter(icon => icon.category.includes(category));
  }
  
  // Filter by search query
  if (normalizedQuery) {
    filtered = filtered.filter(icon => {
      const nameMatch = icon.name.toLowerCase().includes(normalizedQuery);
      const keywordMatch = icon.keywords.some(kw => 
        kw.toLowerCase().includes(normalizedQuery)
      );
      return nameMatch || keywordMatch;
    });
  }
  
  return filtered;
}

// Get icon component by key
export function getIconComponent(key: string): { type: 'lucide' | 'emoji'; value: string; component?: LucideIcon } {
  const [prefix, value] = key.split(':');
  
  if (prefix === 'lucide') {
    const iconComponent = (icons as IconsType)[value as keyof IconsType] as LucideIcon | undefined;
    return {
      type: 'lucide',
      value,
      component: iconComponent,
    };
  }
  
  return {
    type: 'emoji',
    value: value || key, // Fallback for legacy emoji-only values
  };
}

// Convert legacy emoji to new key format
export function migrateIconKey(iconValue: string | null): string {
  if (!iconValue) return 'emoji:📁';
  
  // Already in new format
  if (iconValue.includes(':')) return iconValue;
  
  // Legacy emoji format
  return `emoji:${iconValue}`;
}

// Category templates for quick creation
export interface CategoryTemplate {
  name: string;
  icon: string;
  color: string;
  keywords: string;
  group: 'essential' | 'creator' | 'life';
}

export const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  // Essential (범용 필수)
  { name: '건강/운동', icon: 'emoji:💪', color: '#10b981', keywords: '운동,헬스,피트니스,건강관리,루틴', group: 'essential' },
  { name: '식단/영양', icon: 'emoji:🥗', color: '#22c55e', keywords: '영양제,비타민,식단,건강식,다이어트', group: 'essential' },
  { name: '레시피/맛집', icon: 'emoji:🍳', color: '#f97316', keywords: '요리,음식,맛집,레시피,베이킹,홈쿠킹', group: 'essential' },
  { name: '여행/핫플', icon: 'emoji:✈️', color: '#06b6d4', keywords: '여행,관광,핫플,휴양,해외여행,국내여행', group: 'essential' },
  { name: '쇼핑/템추천', icon: 'emoji:👜', color: '#ec4899', keywords: '쇼핑,템추천,구매,리뷰,언박싱', group: 'essential' },
  { name: '공부/자기계발', icon: 'emoji:📚', color: '#8b5cf6', keywords: '공부,학습,자기계발,독서,강의', group: 'essential' },
  { name: '업무/생산성', icon: 'emoji:💼', color: '#6366f1', keywords: '업무,생산성,노션,일정,프로젝트', group: 'essential' },
  { name: '투자/재테크', icon: 'emoji:📈', color: '#3b82f6', keywords: '투자,주식,코인,부동산,재테크,금융', group: 'essential' },
  { name: '콘텐츠', icon: 'emoji:🎬', color: '#ef4444', keywords: '유튜브,쇼츠,인스타,틱톡,SNS,콘텐츠', group: 'essential' },
  { name: '아이디어/메모', icon: 'emoji:💡', color: '#eab308', keywords: '아이디어,메모,영감,브레인스토밍', group: 'essential' },
  
  // Creator (크리에이터 특화)
  { name: 'AI툴/프롬프트', icon: 'emoji:🤖', color: '#a855f7', keywords: 'AI,인공지능,프롬프트,GPT,미드저니,자동화', group: 'creator' },
  { name: '디자인/레퍼런스', icon: 'emoji:🎨', color: '#f472b6', keywords: '디자인,UI,UX,레퍼런스,인스피레이션', group: 'creator' },
  { name: '건축/공모', icon: 'emoji:🏛️', color: '#8b5cf6', keywords: '건축,공모전,설계,파사드,인테리어', group: 'creator' },
  { name: '렌더링/툴', icon: 'lucide:Box', color: '#ec4899', keywords: 'D5,Lumion,SketchUp,Blender,3D,렌더링,언리얼', group: 'creator' },
  { name: '편집/캡컷', icon: 'emoji:🎞️', color: '#f43f5e', keywords: '영상편집,캡컷,프리미어,다빈치,편집', group: 'creator' },
  { name: '마케팅/브랜딩', icon: 'lucide:Target', color: '#14b8a6', keywords: '마케팅,브랜딩,광고,SNS마케팅,콘텐츠마케팅', group: 'creator' },
  
  // Life (라이프)
  { name: '육아/가족', icon: 'emoji:👶', color: '#f9a8d4', keywords: '육아,가족,아이,부모,교육', group: 'life' },
  { name: '집/인테리어', icon: 'emoji:🏠', color: '#a78bfa', keywords: '집,인테리어,리모델링,홈데코,가구', group: 'life' },
  { name: '루틴', icon: 'lucide:Clock', color: '#fbbf24', keywords: '루틴,습관,아침루틴,저녁루틴,일상', group: 'life' },
  { name: '책/아티클', icon: 'lucide:BookOpen', color: '#84cc16', keywords: '책,독서,아티클,뉴스레터,블로그', group: 'life' },
  { name: '음악/플리', icon: 'emoji:🎵', color: '#22d3ee', keywords: '음악,플레이리스트,노래,앨범', group: 'life' },
  { name: '뉴스/이슈', icon: 'emoji:📰', color: '#64748b', keywords: '뉴스,이슈,시사,트렌드,핫이슈', group: 'life' },
  { name: '취미(게임/스포츠)', icon: 'emoji:🎮', color: '#4ade80', keywords: '게임,스포츠,취미,엔터테인먼트', group: 'life' },
];

export const TEMPLATE_GROUP_LABELS = {
  essential: '범용 필수',
  creator: '크리에이터',
  life: '라이프',
};
