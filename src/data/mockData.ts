import { SavedItem } from '@/types/pickstack';

export const mockItems: SavedItem[] = [
  {
    id: '1',
    created_at: '2024-01-27T10:00:00Z',
    source_type: 'url',
    url: 'https://instagram.com/p/example1',
    title: '아침 공복에 먹으면 좋은 5가지 음식',
    platform: 'Instagram',
    thumbnail_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=500&fit=crop',
    summary_3lines: [
      '공복에 레몬수를 마시면 소화를 촉진한다',
      '바나나는 에너지를 빠르게 공급해준다',
      '아보카도는 좋은 지방으로 포만감을 준다'
    ],
    tags: ['건강', '아침루틴', '다이어트', '영양'],
    category: '건강',
  },
  {
    id: '2',
    created_at: '2024-01-27T09:30:00Z',
    source_type: 'url',
    url: 'https://youtube.com/watch?v=example2',
    title: '2024년 비트코인 전망 - 반감기 이후 예상 시나리오',
    platform: 'YouTube',
    thumbnail_url: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop',
    summary_3lines: [
      '4월 반감기 이후 공급 감소로 가격 상승 예상',
      '기관 투자 증가로 시장 안정성 향상',
      '단기 변동성은 여전히 존재할 것으로 예상'
    ],
    tags: ['비트코인', '암호화폐', '투자', '반감기'],
    category: '투자',
  },
  {
    id: '3',
    created_at: '2024-01-27T08:45:00Z',
    source_type: 'url',
    url: 'https://www.pinterest.com/pin/example3',
    title: '미니멀 주방 인테리어 아이디어',
    platform: 'Pinterest',
    thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
    summary_3lines: [
      '화이트 톤 위주로 깔끔한 느낌 연출',
      '수납장 통일감으로 시각적 정리',
      '그린 식물로 포인트 추가'
    ],
    tags: ['인테리어', '미니멀', '주방', '홈데코'],
    category: '건축',
  },
  {
    id: '4',
    created_at: '2024-01-26T20:00:00Z',
    source_type: 'url',
    url: 'https://tiktok.com/@chef/video/example4',
    title: '5분 완성 마늘버터 파스타',
    platform: 'TikTok',
    thumbnail_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=500&fit=crop',
    summary_3lines: [
      '마늘을 약불에 천천히 볶아 향을 낸다',
      '면수를 넉넉히 넣어 크리미하게 만든다',
      '파슬리와 치즈로 마무리'
    ],
    tags: ['파스타', '간단요리', '자취요리', '레시피'],
    category: '레시피',
  },
  {
    id: '5',
    created_at: '2024-01-26T18:30:00Z',
    source_type: 'url',
    url: 'https://blog.naver.com/example5',
    title: 'D5 렌더링 기초 - 재질 설정 팁',
    platform: 'Naver',
    thumbnail_url: 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=400&h=350&fit=crop',
    summary_3lines: [
      'PBR 재질의 기본 개념 이해하기',
      'Roughness와 Metallic 값 조절 방법',
      '실제 사례로 보는 재질 표현'
    ],
    tags: ['D5', '렌더링', '건축시각화', '3D'],
    category: '렌더링',
  },
  {
    id: '6',
    created_at: '2024-01-26T16:00:00Z',
    source_type: 'url',
    url: 'https://twitter.com/user/status/example6',
    title: '애플 비전프로 실사용 후기',
    platform: 'X',
    thumbnail_url: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=400&h=400&fit=crop',
    summary_3lines: [
      '디스플레이 품질이 기대 이상이다',
      '무게감이 장시간 착용에는 불편',
      '공간 컴퓨팅의 가능성을 보여줌'
    ],
    tags: ['애플', '비전프로', 'VR', 'AR', '테크'],
    category: '기타',
  },
  {
    id: '7',
    created_at: '2024-01-26T14:00:00Z',
    source_type: 'url',
    url: 'https://instagram.com/p/example7',
    title: '홈트 루틴 - 하체 집중 20분',
    platform: 'Instagram',
    thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=550&fit=crop',
    summary_3lines: [
      '스쿼트 3세트로 대퇴사두근 자극',
      '런지로 균형감과 근력 동시 강화',
      '힙브릿지로 엉덩이 라인 만들기'
    ],
    tags: ['홈트', '하체운동', '스쿼트', '운동'],
    category: '건강',
  },
  {
    id: '8',
    created_at: '2024-01-26T12:00:00Z',
    source_type: 'url',
    url: 'https://youtube.com/watch?v=example8',
    title: '주식 차트 보는 법 - 이동평균선 완벽 이해',
    platform: 'YouTube',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=280&fit=crop',
    summary_3lines: [
      '5일선, 20일선, 60일선의 의미',
      '골든크로스와 데드크로스 활용법',
      '지지선과 저항선 찾는 방법'
    ],
    tags: ['주식', '차트분석', '기술적분석', '투자'],
    category: '투자',
  },
  {
    id: '9',
    created_at: '2024-01-25T22:00:00Z',
    source_type: 'text',
    title: '일본 교토 료칸 숙소 추천 메모',
    platform: 'Unknown',
    summary_3lines: [
      '료칸 타와라야 - 전통 가이세키 요리 제공',
      '호시노야 교토 - 현대적 럭셔리 분위기',
      '니시야마 - 가격대비 만족도 높음'
    ],
    tags: ['일본여행', '교토', '료칸', '숙소'],
    category: '기타',
  },
  {
    id: '10',
    created_at: '2024-01-25T20:00:00Z',
    source_type: 'url',
    url: 'https://brunch.co.kr/@user/example10',
    title: '집에서 만드는 수제 피클 레시피',
    platform: 'Brunch',
    thumbnail_url: 'https://images.unsplash.com/photo-1589621316382-008455b857cd?w=400&h=450&fit=crop',
    summary_3lines: [
      '신선한 오이와 양파 준비하기',
      '식초, 설탕, 소금 황금 비율 공개',
      '3일 숙성 후 최적의 맛 완성'
    ],
    tags: ['피클', '홈메이드', '밑반찬', '레시피'],
    category: '레시피',
  },
];
