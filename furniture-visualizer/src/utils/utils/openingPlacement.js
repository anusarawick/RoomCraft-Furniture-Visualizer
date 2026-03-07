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

  const horizontalWidth = Math.min(span, roomWidth)
  const horizontalDepth = Math.min(thickness, roomDepth)
  const verticalWidth = Math.min(thickness, roomWidth)
  const verticalDepth = Math.min(span, roomDepth)

  const candidates = [
    {
      wall: 'top',
      x: clampValue(centerX - horizontalWidth / 2, 0, roomWidth - horizontalWidth),
      y: 0,
      width: horizontalWidth,
      depth: horizontalDepth,
      distance: Math.abs(centerY),
    },
    {
      wall: 'bottom',
      x: clampValue(centerX - horizontalWidth / 2, 0, roomWidth - horizontalWidth),
      y: roomDepth - horizontalDepth,
      width: horizontalWidth,
      depth: horizontalDepth,
      distance: Math.abs(centerY - roomDepth),
    },
    {
      wall: 'left',
      x: 0,
      y: clampValue(centerY - verticalDepth / 2, 0, roomDepth - verticalDepth),
      width: verticalWidth,
      depth: verticalDepth,
      distance: Math.abs(centerX),
    },
    {
      wall: 'right',
      x: roomWidth - verticalWidth,
      y: clampValue(centerY - verticalDepth / 2, 0, roomDepth - verticalDepth),
      width: verticalWidth,
      depth: verticalDepth,
      distance: Math.abs(centerX - roomWidth),
    },
  ]

  return candidates.reduce((closest, candidate) =>
    candidate.distance < closest.distance ? candidate : closest,
  )
}
