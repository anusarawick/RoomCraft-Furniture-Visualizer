import { normalizeDesignSizes } from '../normalizeDesign'

describe('normalizeDesignSizes', () => {
  it('assigns fallback rooms and clamps item positions into room bounds', () => {
    const design = {
      room: { width: 5, depth: 4 },
      items: [
        {
          id: 'item-1',
          type: 'furniture-12',
          width: 0.6,
          depth: 0.67,
          height: 0.52,
          x: 10,
          y: 10,
        },
      ],
    }

    const normalized = normalizeDesignSizes(design)
    const [item] = normalized.items

    expect(item).toMatchObject({
      width: 0.6,
      depth: 0.67,
      roomId: 'room-1',
    })
    expect(item.x).toBeLessThanOrEqual(4.4)
    expect(item.y).toBeLessThanOrEqual(3.33)
    expect(normalized.rooms[0].id).toBe('room-1')
  })

  it('keeps provided rooms and fills missing coordinates', () => {
    const normalized = normalizeDesignSizes({
      rooms: [
        { id: 'room-a', width: 4, depth: 4 },
        { id: 'room-b', width: 5, depth: 4 },
      ],
      items: [],
    })

    expect(normalized.rooms[0]).toMatchObject({ x: 0, y: 0 })
    expect(normalized.rooms[1]).toMatchObject({ x: 5.8, y: 0 })
  })
})
