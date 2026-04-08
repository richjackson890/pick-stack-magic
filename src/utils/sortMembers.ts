const MEMBER_ORDER: Record<string, number> = {
  '이석영': 0,
  '김경종': 1,
  '이충희': 2,
  '천서영': 3,
  '김정환': 4,
  '김혜원': 5,
  '김원태': 6,
  '정민재': 7,
  '박운식': 8,
  '박채진': 9,
}

export function getMemberOrder(name: string | null | undefined): number {
  if (!name) return 99
  for (const [key, val] of Object.entries(MEMBER_ORDER)) {
    if (name.includes(key)) return val
  }
  return 99
}

export function sortByPosition<T extends { profiles?: { full_name?: string | null, display_name?: string | null } | null }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const nameA = a.profiles?.full_name || a.profiles?.display_name || ''
    const nameB = b.profiles?.full_name || b.profiles?.display_name || ''
    return getMemberOrder(nameA) - getMemberOrder(nameB)
  })
}
