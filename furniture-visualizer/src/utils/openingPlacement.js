import { getRoomWallSegments } from './roomShape'

const OPENING_TYPES = new Set(['door', 'window'])

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max)

export const isOpeningElementType = (elementType) => OPENING_TYPES.has(elementType)

export const isOpeningItem = (item) => isOpeningElementType(item?.elementType)

const getOpeningSize = (item) => {
  const width = Number.isFinite(item?.width) ? Math.max(item.width, 0.2) : 0.9
  const depth = Number.isFinite(item?.depth) ? Math.max(item.depth, 0.2) : 0.2
  return {
    span: Math.max(width, depth),
    thickness: Math.min(width, depth),
  }
}

export const snapOpeningToRoomWall = (item, room, centerX, centerY) => {
  const roomWidth = Math.max(1, Number(room?.width) || 1)
  const roomDepth = Math.max(1, Number(room?.depth) || 1)
  const { span, thickness } = getOpeningSize(item)
  const candidates = getRoomWallSegments(room)
    .map((segment) => {
      if (segment.axis === 'horizontal') {
        const width = Math.min(span, segment.length)
        const depth = Math.min(thickness, roomDepth)
        const minX = Math.min(segment.x1, segment.x2)
        const maxX = Math.max(segment.x1, segment.x2)
        const x = clampValue(centerX - width / 2, minX, Math.max(minX, maxX - width))
        const y = segment.wall === 'bottom' ? segment.y1 - depth : segment.y1
        return {
          wall: segment.wall,
          x,
          y,
          width,
          depth,
          distance:
            Math.abs(centerY - segment.y1) +
            Math.abs(centerX - clampValue(centerX, minX, maxX)),
        }
      }

      const width = Math.min(thickness, roomWidth)
      const depth = Math.min(span, segment.length)
      const minY = Math.min(segment.y1, segment.y2)
      const maxY = Math.max(segment.y1, segment.y2)
      const y = clampValue(centerY - depth / 2, minY, Math.max(minY, maxY - depth))
      const x =
        segment.wall === 'left'
          ? segment.x1
          : segment.x1 - width

      return {
        wall: segment.wall,
        x,
        y,
        width,
        depth,
        distance:
          Math.abs(centerX - segment.x1) +
          Math.abs(centerY - clampValue(centerY, minY, maxY)),
      }
    })
    .filter((candidate) => candidate.width > 0 && candidate.depth > 0)

  return candidates.reduce((closest, candidate) =>
    candidate.distance < closest.distance ? candidate : closest,
  )
}
