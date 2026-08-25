// 직급 정렬 순서 (숫자가 작을수록 위). 실제 profiles.position 값 기준.
const POSITION_ORDER: Record<string, number> = {
  '소장': 0,
  '실장': 1,
  '팀장/책임': 2,
  '책임/팀장': 2,
  '팀장': 3,
  '대리': 4,
  '소원': 5,
}

// 목록에 없는 직급이나 null 은 맨 아래로
const UNRANKED = 99

export function getPositionOrder(position: string | null | undefined): number {
  if (!position) return UNRANKED
  const p = position.trim()
  if (p in POSITION_ORDER) return POSITION_ORDER[p]
  // 표기 흔들림 대응 — 긴 키부터 부분일치 ('팀장/책임'이 '팀장'보다 먼저 걸리도록)
  const keys = Object.keys(POSITION_ORDER).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (p.includes(k)) return POSITION_ORDER[k]
  }
  return UNRANKED
}

interface SortableMember {
  position?: string | null
  name?: string | null
}

// 직급 우선, 같은 직급 안에서는 이름순(가나다). 팀원 리스트·연차 리스트 공통.
export function compareMembers(a: SortableMember, b: SortableMember): number {
  const byPosition = getPositionOrder(a.position) - getPositionOrder(b.position)
  if (byPosition !== 0) return byPosition
  return (a.name || '').localeCompare(b.name || '', 'ko')
}

type WithProfile = {
  profiles?: {
    position?: string | null
    display_name?: string | null
    name?: string | null
    full_name?: string | null
  } | null
}

export function sortByPosition<T extends WithProfile>(members: T[]): T[] {
  return [...members].sort((a, b) =>
    compareMembers(
      { position: a.profiles?.position, name: a.profiles?.display_name || a.profiles?.name || a.profiles?.full_name },
      { position: b.profiles?.position, name: b.profiles?.display_name || b.profiles?.name || b.profiles?.full_name },
    ),
  )
}
