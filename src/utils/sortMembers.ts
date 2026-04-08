const POSITION_ORDER: Record<string, number> = {
  '소장': 0,
  '실장': 1,
  '팀장/책임': 2,
  '책임/팀장': 2,
  '팀장': 3,
  '대리': 4,
  '소원': 5,
  '인턴': 6,
  '실습': 7,
}

export function getPositionOrder(position: string | null | undefined): number {
  if (!position) return 99
  for (const [key, val] of Object.entries(POSITION_ORDER)) {
    if (position.includes(key)) return val
  }
  return 99
}

export function sortByPosition<T extends { profiles?: { position?: string | null } | null }>(members: T[]): T[] {
  return [...members].sort((a, b) =>
    getPositionOrder(a.profiles?.position) - getPositionOrder(b.profiles?.position)
  )
}
