const L_SHAPED = 'L-shaped'
const SHAPE_EPSILON = 0.0001

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const overlaps = (a, b) =>
  a.left < b.right - SHAPE_EPSILON &&
  a.right > b.left + SHAPE_EPSILON &&
  a.top < b.bottom - SHAPE_EPSILON &&
  a.bottom > b.top + SHAPE_EPSILON

export const isLShapedRoom = (room) => room?.shape === L_SHAPED

export const getRoomCutout = (room) => {
  if (!isLShapedRoom(room)) return null

  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)
  const cutoutWidth = clamp(width * 0.38, width * 0.2, width * 0.55)
  const cutoutDepth = clamp(depth * 0.42, depth * 0.22, depth * 0.58)

  return {
    x: width - cutoutWidth,
    y: 0,
    width: cutoutWidth,
    depth: cutoutDepth,
    right: width,
    bottom: cutoutDepth,
  }
}

export const getRoomPolygonPoints = (room, offsetX = 0, offsetY = 0) => {
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)
  const cutout = getRoomCutout(room)

  if (!cutout) {
    return [
      { x: offsetX, y: offsetY },
      { x: offsetX + width, y: offsetY },
      { x: offsetX + width, y: offsetY + depth },
      { x: offsetX, y: offsetY + depth },
    ]
  }

  return [
    { x: offsetX, y: offsetY },
    { x: offsetX + cutout.x, y: offsetY },
    { x: offsetX + cutout.x, y: offsetY + cutout.depth },
    { x: offsetX + width, y: offsetY + cutout.depth },
    { x: offsetX + width, y: offsetY + depth },
    { x: offsetX, y: offsetY + depth },
  ]
}

export const getRoomClipPath = (room) => {
  const points = getRoomPolygonPoints(room)
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)
  return `polygon(${points
    .map((point) => `${(point.x / width) * 100}% ${(point.y / depth) * 100}%`)
    .join(', ')})`
}

export const getRoomWallSegments = (room) => {
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)
  const cutout = getRoomCutout(room)

  if (!cutout) {
    return [
      { wall: 'top', axis: 'horizontal', x1: 0, y1: 0, x2: width, y2: 0, length: width },
      {
        wall: 'right',
        axis: 'vertical',
        x1: width,
        y1: 0,
        x2: width,
        y2: depth,
        length: depth,
      },
      {
        wall: 'bottom',
        axis: 'horizontal',
        x1: 0,
        y1: depth,
        x2: width,
        y2: depth,
        length: width,
      },
      { wall: 'left', axis: 'vertical', x1: 0, y1: 0, x2: 0, y2: depth, length: depth },
    ]
  }

  return [
    { wall: 'top', axis: 'horizontal', x1: 0, y1: 0, x2: cutout.x, y2: 0, length: cutout.x },
    {
      wall: 'inner-vertical',
      axis: 'vertical',
      x1: cutout.x,
      y1: 0,
      x2: cutout.x,
      y2: cutout.depth,
      length: cutout.depth,
    },
    {
      wall: 'inner-horizontal',
      axis: 'horizontal',
      x1: cutout.x,
      y1: cutout.depth,
      x2: width,
      y2: cutout.depth,
      length: width - cutout.x,
    },
    {
      wall: 'right',
      axis: 'vertical',
      x1: width,
      y1: cutout.depth,
      x2: width,
      y2: depth,
      length: depth - cutout.depth,
    },
    {
      wall: 'bottom',
      axis: 'horizontal',
      x1: 0,
      y1: depth,
      x2: width,
      y2: depth,
      length: width,
    },
    { wall: 'left', axis: 'vertical', x1: 0, y1: 0, x2: 0, y2: depth, length: depth },
  ]
}

export const isPointInsideRoom = (room, x, y, padding = 0) => {
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)

  if (
    x < padding - SHAPE_EPSILON ||
    y < padding - SHAPE_EPSILON ||
    x > width - padding + SHAPE_EPSILON ||
    y > depth - padding + SHAPE_EPSILON
  ) {
    return false
  }

  const cutout = getRoomCutout(room)
  if (!cutout) return true

  return !(
    x > cutout.x - padding + SHAPE_EPSILON &&
    y < cutout.bottom + padding - SHAPE_EPSILON
  )
}

export const isBoundsInsideRoom = (room, bounds) => {
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)

  if (
    bounds.left < -SHAPE_EPSILON ||
    bounds.top < -SHAPE_EPSILON ||
    bounds.right > width + SHAPE_EPSILON ||
    bounds.bottom > depth + SHAPE_EPSILON
  ) {
    return false
  }

  const cutout = getRoomCutout(room)
  if (!cutout) return true

  return !overlaps(bounds, {
    left: cutout.x,
    top: cutout.y,
    right: cutout.right,
    bottom: cutout.bottom,
  })
}

export const clampPointWithinRoom = (room, x, y, padding = 0) => {
  const width = Math.max(1, Number(room?.width) || 1)
  const depth = Math.max(1, Number(room?.depth) || 1)
  const next = {
    x: clamp(x, padding, Math.max(padding, width - padding)),
    y: clamp(y, padding, Math.max(padding, depth - padding)),
  }

  const cutout = getRoomCutout(room)
  if (!cutout) return next

  const insideCutout =
    next.x > cutout.x - padding + SHAPE_EPSILON &&
    next.y < cutout.bottom + padding - SHAPE_EPSILON
  if (!insideCutout) return next

  const moveLeftX = clamp(cutout.x - padding, padding, Math.max(padding, width - padding))
  const moveDownY = clamp(
    cutout.bottom + padding,
    padding,
    Math.max(padding, depth - padding),
  )
  const leftDistance = Math.abs(next.x - moveLeftX)
  const downDistance = Math.abs(next.y - moveDownY)

  if (leftDistance <= downDistance) {
    next.x = moveLeftX
  } else {
    next.y = moveDownY
  }

  return next
}
