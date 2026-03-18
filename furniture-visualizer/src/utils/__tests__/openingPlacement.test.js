import {
  isOpeningElementType,
  isOpeningItem,
  snapOpeningToRoomWall,
} from '../openingPlacement'

describe('openingPlacement', () => {
  it('identifies opening types', () => {
    expect(isOpeningElementType('door')).toBe(true)
    expect(isOpeningElementType('window')).toBe(true)
    expect(isOpeningElementType('chair')).toBe(false)
    expect(isOpeningItem({ elementType: 'window' })).toBe(true)
  })

  it('snaps a door to the nearest horizontal wall', () => {
    const result = snapOpeningToRoomWall(
      { width: 0.9, depth: 0.2, elementType: 'door' },
      { width: 5, depth: 4 },
      2.5,
      0.2,
    )

    expect(result).toMatchObject({
      wall: 'top',
      x: 2.05,
      y: 0,
      width: 0.9,
      depth: 0.2,
    })
  })

  it('snaps an opening to the nearest vertical wall when closer', () => {
    const result = snapOpeningToRoomWall(
      { width: 1.2, depth: 0.2, elementType: 'window' },
      { width: 5, depth: 4 },
      4.9,
      2,
    )

    expect(result).toMatchObject({
      wall: 'right',
      x: 4.8,
      width: 0.2,
      depth: 1.2,
    })
  })

  it('can snap to inner walls in an L-shaped room', () => {
    const result = snapOpeningToRoomWall(
      { width: 1, depth: 0.2, elementType: 'window' },
      { shape: 'L-shaped', width: 8, depth: 6 },
      5.3,
      1.6,
    )

    expect(['inner-vertical', 'inner-horizontal']).toContain(result.wall)
  })
})
