import { createNewDesign, createSampleDesign } from '../designs'

describe('design helpers', () => {
  it('creates a single-room design by default', () => {
    const design = createNewDesign({ name: 'Studio' })

    expect(design.name).toBe('Studio')
    expect(design.rooms).toHaveLength(1)
    expect(design.room).toEqual(design.rooms[0])
    expect(design.items).toEqual([])
  })

  it('creates a multi-room design grid when requested', () => {
    const design = createNewDesign({
      name: 'Suite',
      room: { width: 4, depth: 3, name: 'Guest Room' },
      planType: 'multi',
      roomCount: 3,
    })

    expect(design.rooms).toHaveLength(3)
    expect(design.rooms.map((room) => room.name)).toEqual([
      'Guest Room 1',
      'Guest Room 2',
      'Guest Room 3',
    ])
    expect(design.rooms[1]).toMatchObject({ x: 4.8, y: 0 })
    expect(design.rooms[2]).toMatchObject({ x: 0, y: 3.8 })
  })

  it('creates a sample design with furniture in the first room', () => {
    const design = createSampleDesign()

    expect(design.items).toHaveLength(3)
    expect(new Set(design.items.map((item) => item.roomId))).toEqual(new Set([design.rooms[0].id]))
  })
})
