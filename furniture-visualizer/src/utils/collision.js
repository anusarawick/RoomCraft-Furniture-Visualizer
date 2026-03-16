import { isOpeningItem } from './openingPlacement'
import { isBoundsInsideRoom } from './roomShape'

const OVERLAP_EPSILON = 0.0001
const WINDOW_CLEARANCE_BUFFER = 0.06

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

const resolveRoomForItem = (item, { room = null, rooms = null, defaultRoomId = null } = {}) => {
  if (room) return room
  if (!rooms?.length) return null
  const roomId = resolveRoomId(item, defaultRoomId)
  return rooms.find((entry) => entry.id === roomId) || null
}

const getWindowBottomHeight = (windowItem, room) => {
  if (windowItem?.elementType !== 'window') return 0
  const roomHeight = Number.isFinite(room?.height) ? room.height : 2.7
  return Math.min(Math.max(roomHeight * 0.34, 0.72), 1.2)
}

const getItemHeight = (item) => (Number.isFinite(item?.height) ? item.height : 0)

const canFurnitureSitUnderWindow = (windowItem, otherItem, context) => {
  const room = context?.room
  if (!room) return false
  if (isOpeningItem(otherItem)) return false
  const bottomHeight = getWindowBottomHeight(windowItem, room)
  return getItemHeight(otherItem) + WINDOW_CLEARANCE_BUFFER < bottomHeight
}

const pairHasCollision = (first, second, context) => {
  if (!overlaps(toBounds(first), toBounds(second))) return false
  if (first?.elementType === 'window' && canFurnitureSitUnderWindow(first, second, context)) {
    return false
  }
  if (second?.elementType === 'window' && canFurnitureSitUnderWindow(second, first, context)) {
    return false
  }
  return true
}

export const getCollisionMap = (items, { defaultRoomId = null, room = null, rooms = null } = {}) => {
  const colliding = new Set()
  const candidates = items.filter((item) => isCollidableItem(item))

  for (let index = 0; index < candidates.length; index += 1) {
    const first = candidates[index]
    const firstRoomId = resolveRoomId(first, defaultRoomId)
    for (let nextIndex = index + 1; nextIndex < candidates.length; nextIndex += 1) {
      const second = candidates[nextIndex]
      const secondRoomId = resolveRoomId(second, defaultRoomId)
      if (firstRoomId !== secondRoomId) continue
      if (first.id === second.id) continue
      if (
        pairHasCollision(first, second, {
          room:
            resolveRoomForItem(first, { room, rooms, defaultRoomId }) ||
            resolveRoomForItem(second, { room, rooms, defaultRoomId }),
        })
      ) {
        colliding.add(first.id)
        colliding.add(second.id)
      }
    }
  }

  return colliding
}

export const hasItemCollision = (itemId, items, { defaultRoomId = null, room = null, rooms = null } = {}) =>
  getCollisionMap(items, { defaultRoomId, room, rooms }).has(itemId)

export const isPlacementConflicting = (
  candidate,
  items,
  { ignoreId = null, defaultRoomId = null, room = null, rooms = null } = {},
) => {
  if (!hasNumericBounds(candidate) || !isCollidableItem(candidate)) return false

  const candidateRoomId = resolveRoomId(candidate, defaultRoomId)
  const collisionRoom = resolveRoomForItem(candidate, { room, rooms, defaultRoomId })
  if (
    collisionRoom &&
    !isBoundsInsideRoom(collisionRoom, toBounds(candidate))
  ) {
    return true
  }

  return items.some((existing) => {
    if (!hasNumericBounds(existing)) return false
    if (!isCollidableItem(existing)) return false
    if (existing.id === ignoreId || existing.id === candidate.id) return false
    if (resolveRoomId(existing, defaultRoomId) !== candidateRoomId) return false
    return pairHasCollision(candidate, existing, { room: collisionRoom })
  })
}
