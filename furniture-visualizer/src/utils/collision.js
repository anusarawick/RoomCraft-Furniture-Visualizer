const OVERLAP_EPSILON = 0.0001

const hasNumericBounds = (item) =>
  Number.isFinite(item?.x) &&
  Number.isFinite(item?.y) &&
  Number.isFinite(item?.width) &&
  Number.isFinite(item?.depth)

const toBounds = (item) => ({
  left: item.x,
  top: item.y,
  right: item.x + item.width,
  bottom: item.y + item.depth,
})

const overlaps = (a, b) =>
  a.left < b.right - OVERLAP_EPSILON &&
  a.right > b.left + OVERLAP_EPSILON &&
  a.top < b.bottom - OVERLAP_EPSILON &&
  a.bottom > b.top + OVERLAP_EPSILON

const resolveRoomId = (item, defaultRoomId) => item?.roomId || defaultRoomId || null

const isCollidableItem = (item) => hasNumericBounds(item)

export const getCollisionMap = (items, { defaultRoomId = null } = {}) => {
  const colliding = new Set()
  const candidates = items.filter((item) => isCollidableItem(item))

  for (let index = 0; index < candidates.length; index += 1) {
    const first = candidates[index]
    const firstRoomId = resolveRoomId(first, defaultRoomId)
    const firstBounds = toBounds(first)
    for (let nextIndex = index + 1; nextIndex < candidates.length; nextIndex += 1) {
      const second = candidates[nextIndex]
      const secondRoomId = resolveRoomId(second, defaultRoomId)
      if (firstRoomId !== secondRoomId) continue
      if (first.id === second.id) continue
      if (overlaps(firstBounds, toBounds(second))) {
        colliding.add(first.id)
        colliding.add(second.id)
      }
    }
  }

  return colliding
}

export const hasItemCollision = (itemId, items, { defaultRoomId = null } = {}) =>
  getCollisionMap(items, { defaultRoomId }).has(itemId)

export const isPlacementConflicting = (
  candidate,
  items,
  { ignoreId = null, defaultRoomId = null } = {},
) => {
  if (!hasNumericBounds(candidate) || !isCollidableItem(candidate)) return false

  const candidateRoomId = resolveRoomId(candidate, defaultRoomId)
  const candidateBounds = toBounds(candidate)

  return items.some((existing) => {
    if (!hasNumericBounds(existing)) return false
    if (!isCollidableItem(existing)) return false
    if (existing.id === ignoreId || existing.id === candidate.id) return false
    if (resolveRoomId(existing, defaultRoomId) !== candidateRoomId) return false
    return overlaps(candidateBounds, toBounds(existing))
  })
}
