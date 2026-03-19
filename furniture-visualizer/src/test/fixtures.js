import { FURNITURE_CATALOG } from '../member 3/catalog'

export const createTestUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Jamie Designer',
  email: 'jamie@example.com',
  role: 'Designer',
  accountType: 'customer',
  createdAt: '2025-01-15T12:00:00.000Z',
  ...overrides,
})

export const createTestRoom = (overrides = {}) => ({
  id: 'room-1',
  name: 'Living Room',
  width: 5.4,
  depth: 4.2,
  height: 2.7,
  wallColor: '#F5EDE3',
  floorColor: '#C9B8A0',
  shape: 'Rectangle',
  x: 0,
  y: 0,
  ...overrides,
})

export const createTestCatalog = () =>
  FURNITURE_CATALOG.slice(0, 4).map((item) => ({ ...item }))

export const createTestDesign = (overrides = {}) => {
  const room = createTestRoom()
  const items = [
    {
      id: 'item-1',
      type: 'furniture-12',
      label: 'Chair',
      width: 0.6,
      depth: 0.67,
      height: 0.52,
      color: '#8B7763',
      shade: 0.12,
      rotation: 0,
      x: 0.5,
      y: 0.8,
      roomId: room.id,
    },
  ]

  return {
    id: 'design-1',
    name: 'Living Design',
    room,
    rooms: [room],
    items,
    accentColor: '#C97C5D',
    accentOverrideEnabled: false,
    globalShade: 0.1,
    createdAt: '2025-03-10T09:00:00.000Z',
    updatedAt: '2025-03-12T09:00:00.000Z',
    ...overrides,
  }
}
