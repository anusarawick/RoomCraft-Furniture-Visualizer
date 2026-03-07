import { DEFAULT_ROOM } from './constants'
import { createId } from '../utils/ids'

const buildRooms = (template, count) => {
  const gap = 0.8
  const perRow = 2
  return Array.from({ length: count }, (_, index) => {
    const col = index % perRow
    const row = Math.floor(index / perRow)
    const baseName = template.name || 'Room'
    return {
      ...template,
      id: createId(),
      name: count > 1 ? `${baseName} ${index + 1}` : baseName,
      x: col * (template.width + gap),
      y: row * (template.depth + gap),
    }
  })
}

export const createNewDesign = ({
  name = 'New Consultation',
  room = {},
  rooms = null,
  planType = 'single',
  roomCount = 1,
} = {}) => {
  const now = new Date().toISOString()
  const baseRoom = { ...DEFAULT_ROOM, ...room }
  const desiredCount =
    planType === 'multi' ? Math.max(2, Number(roomCount) || 2) : 1
  const nextRooms =
    rooms?.length ? rooms : buildRooms(baseRoom, desiredCount)
  return {
    id: createId(),
    name,
    room: nextRooms[0],
    rooms: nextRooms,
    items: [],
    accentColor: '#C97C5D',
    globalShade: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export const createSampleDesign = () => {
  const design = createNewDesign({ name: 'Showroom Mix', room: { name: 'Living' } })
  const roomId = design.rooms[0].id
  design.items = [
    {
      id: createId(),
      type: 'furniture-4',
      label: 'Bed 1',
      width: 0.94,
      depth: 1.2,
      height: 0.61,
      color: '#E6E0D8',
      shade: 0.08,
      rotation: 0,
      x: 0.5,
      y: 0.6,
      roomId,
    },
    {
      id: createId(),
      type: 'furniture-12',
      label: 'Chair',
      width: 0.6,
      depth: 0.67,
      height: 0.52,
      color: '#8B7763',
      shade: 0.12,
      rotation: 0,
      x: 2.4,
      y: 1.2,
      roomId,
    },
    {
      id: createId(),
      type: 'furniture-13',
      label: 'Sofa 1',
      width: 0.8,
      depth: 2.13,
      height: 0.71,
      color: '#4C5A63',
      shade: 0.1,
      rotation: 0,
      x: 1.6,
      y: 2.2,
      roomId,
    },
  ]
  return design
}
