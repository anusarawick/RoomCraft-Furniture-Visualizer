import { clamp } from '../member 2/clamp'

export const normalizeRotation = (rotation) => {
  const value = Number.isFinite(rotation) ? rotation : 0
  return ((value % 360) + 360) % 360
}

export const getRotatedFootprint = (width, depth, rotation) => {
  const radians = (normalizeRotation(rotation) * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  return {
    width: width * cos + depth * sin,
    depth: width * sin + depth * cos,
  }
}

export const clampItemWithinRoom = (item, room) => {
  if (!item || !room) return item

  const width = Number.isFinite(item.width) ? item.width : 0
  const depth = Number.isFinite(item.depth) ? item.depth : 0
  const roomWidth = Number.isFinite(room.width) ? room.width : width
  const roomDepth = Number.isFinite(room.depth) ? room.depth : depth
  const rotation = normalizeRotation(item.rotation)

  if (width <= 0 || depth <= 0 || roomWidth <= 0 || roomDepth <= 0) {
    return { ...item, rotation }
  }

  const footprint = getRotatedFootprint(width, depth, rotation)
  const halfFootprintX = Math.min(roomWidth / 2, footprint.width / 2)
  const halfFootprintY = Math.min(roomDepth / 2, footprint.depth / 2)
  const centerX = (Number.isFinite(item.x) ? item.x : 0) + width / 2
  const centerY = (Number.isFinite(item.y) ? item.y : 0) + depth / 2
  const clampedCenterX = clamp(centerX, halfFootprintX, Math.max(halfFootprintX, roomWidth - halfFootprintX))
  const clampedCenterY = clamp(centerY, halfFootprintY, Math.max(halfFootprintY, roomDepth - halfFootprintY))

  return {
    ...item,
    rotation,
    x: clamp(clampedCenterX - width / 2, 0, Math.max(0, roomWidth - width)),
    y: clamp(clampedCenterY - depth / 2, 0, Math.max(0, roomDepth - depth)),
  }
}
