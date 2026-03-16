import { FURNITURE_CATALOG } from '../member 3/catalog'
import { clamp } from '../member 2/clamp'
import { DEFAULT_ROOM } from './constants'

const LEGACY_SIZES = {
  chair: { width: 0.5, depth: 0.5, height: 0.9 },
  'dining-table': { width: 1.6, depth: 0.9, height: 0.75 },
  'side-table': { width: 0.5, depth: 0.5, height: 0.55 },
  sofa: { width: 2.0, depth: 0.9, height: 0.85 },
  bed: { width: 2.0, depth: 1.5, height: 0.5 },
  bookshelf: { width: 1.0, depth: 0.35, height: 1.8 },
  desk: { width: 1.2, depth: 0.6, height: 0.75 },
}

const EPS = 0.001

const isClose = (a, b) => Math.abs(a - b) < EPS

const matchesSize = (item, size) =>
  isClose(item.width, size.width) &&
  isClose(item.depth, size.depth) &&
  isClose(item.height, size.height)

const buildFallbackRooms = (design) => {
  if (Array.isArray(design.rooms) && design.rooms.length) {
    return design.rooms.map((room, index) => {
      const x = Number.isFinite(room.x) ? room.x : index * (room.width + 0.8)
      const y = Number.isFinite(room.y) ? room.y : 0
      return {
        ...DEFAULT_ROOM,
        ...room,
        id: room.id || `room-${index + 1}`,
        x,
        y,
      }
    })
  }

  const legacyRoom = design.room || {}
  return [
    {
      ...DEFAULT_ROOM,
      ...legacyRoom,
      id: legacyRoom.id || 'room-1',
      x: Number.isFinite(legacyRoom.x) ? legacyRoom.x : 0,
      y: Number.isFinite(legacyRoom.y) ? legacyRoom.y : 0,
    },
  ]
}

export const normalizeDesignSizes = (design) => {
  if (!design) return design
  const catalogMap = new Map(FURNITURE_CATALOG.map((item) => [item.id, item]))
  const rooms = buildFallbackRooms(design)
  const roomMap = new Map(rooms.map((room) => [room.id, room]))
  const fallbackRoom = rooms[0]
  const baseItems = Array.isArray(design.items) ? design.items : []

  const updatedItems = baseItems.map((item) => {
    const legacy = LEGACY_SIZES[item.type]
    const catalogItem = catalogMap.get(item.type)
    let nextItem = item
    if (legacy && catalogItem && matchesSize(item, legacy) && !matchesSize(item, catalogItem)) {
      nextItem = {
        ...item,
        width: catalogItem.width,
        depth: catalogItem.depth,
        height: catalogItem.height,
      }
    }

    const roomId = roomMap.has(nextItem.roomId) ? nextItem.roomId : fallbackRoom.id
    const room = roomMap.get(roomId) || fallbackRoom
    const width = clamp(nextItem.width, 0.2, room.width)
    const depth = clamp(nextItem.depth, 0.2, room.depth)
    const maxX = Math.max(0, room.width - width)
    const maxY = Math.max(0, room.depth - depth)
    return {
      ...nextItem,
      roomId,
      width,
      depth,
      x: clamp(nextItem.x, 0, maxX),
      y: clamp(nextItem.y, 0, maxY),
    }
  })

  return { ...design, rooms, room: rooms[0], items: updatedItems }
}
