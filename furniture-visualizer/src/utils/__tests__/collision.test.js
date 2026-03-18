import {
  getCollisionMap,
  hasItemCollision,
  isPlacementConflicting,
} from '../collision'

describe('collision', () => {
  it('detects overlaps in the same room only', () => {
    const items = [
      { id: 'a', x: 0, y: 0, width: 1, depth: 1, roomId: 'room-1' },
      { id: 'b', x: 0.5, y: 0.5, width: 1, depth: 1, roomId: 'room-1' },
      { id: 'c', x: 0.5, y: 0.5, width: 1, depth: 1, roomId: 'room-2' },
    ]

    expect([...getCollisionMap(items)]).toEqual(['a', 'b'])
    expect(hasItemCollision('c', items)).toBe(false)
  })

  it('allows low furniture under a window but blocks taller items', () => {
    const room = { id: 'room-1', width: 5, depth: 4, height: 2.7 }
    const windowItem = {
      id: 'window-1',
      x: 1,
      y: 0,
      width: 1.2,
      depth: 0.2,
      height: 1.2,
      roomId: room.id,
      elementType: 'window',
    }
    const lowBench = {
      id: 'bench-1',
      x: 1,
      y: 0,
      width: 1.2,
      depth: 0.4,
      height: 0.4,
      roomId: room.id,
    }
    const tallShelf = {
      id: 'shelf-1',
      x: 1,
      y: 0,
      width: 1.2,
      depth: 0.4,
      height: 1.4,
      roomId: room.id,
    }

    expect(isPlacementConflicting(lowBench, [windowItem], { room, defaultRoomId: room.id })).toBe(
      false,
    )
    expect(
      isPlacementConflicting(tallShelf, [windowItem], { room, defaultRoomId: room.id }),
    ).toBe(true)
  })

  it('treats out-of-bounds placements as conflicts', () => {
    const room = { id: 'room-1', width: 3, depth: 3 }

    expect(
      isPlacementConflicting(
        { id: 'a', x: 2.5, y: 2.5, width: 1, depth: 1, roomId: room.id },
        [],
        { room, defaultRoomId: room.id },
      ),
    ).toBe(true)
  })
})
