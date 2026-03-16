import { clamp } from '../member 2/clamp'
import { getRoomCutout, isBoundsInsideRoom } from './roomShape'

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
  const toItemPosition = (nextCenterX, nextCenterY) => ({
    ...item,
    rotation,
    x: clamp(nextCenterX - width / 2, 0, Math.max(0, roomWidth - width)),
    y: clamp(nextCenterY - depth / 2, 0, Math.max(0, roomDepth - depth)),
  })

  const toFootprintBounds = (nextCenterX, nextCenterY) => ({
    left: nextCenterX - footprint.width / 2,
    right: nextCenterX + footprint.width / 2,
    top: nextCenterY - footprint.depth / 2,
    bottom: nextCenterY + footprint.depth / 2,
  })

  const baseCandidate = toItemPosition(clampedCenterX, clampedCenterY)
  if (isBoundsInsideRoom(room, toFootprintBounds(clampedCenterX, clampedCenterY))) {
    return baseCandidate
  }

  const cutout = getRoomCutout(room)
  if (!cutout) return baseCandidate

  const candidateCenters = [
    {
      x: clamp(
        cutout.x - footprint.width / 2,
        halfFootprintX,
        Math.max(halfFootprintX, roomWidth - halfFootprintX),
      ),
      y: clampedCenterY,
    },
    {
      x: clampedCenterX,
      y: clamp(
        cutout.bottom + footprint.depth / 2,
        halfFootprintY,
        Math.max(halfFootprintY, roomDepth - halfFootprintY),
      ),
    },
  ]

  const validCandidates = candidateCenters.filter((center) =>
    isBoundsInsideRoom(room, toFootprintBounds(center.x, center.y)),
  )

  if (!validCandidates.length) {
    return baseCandidate
  }

  validCandidates.sort((first, second) => {
    const firstDistance =
      (first.x - clampedCenterX) * (first.x - clampedCenterX) +
      (first.y - clampedCenterY) * (first.y - clampedCenterY)
    const secondDistance =
      (second.x - clampedCenterX) * (second.x - clampedCenterX) +
      (second.y - clampedCenterY) * (second.y - clampedCenterY)
    return firstDistance - secondDistance
  })

  return toItemPosition(validCandidates[0].x, validCandidates[0].y)
}
