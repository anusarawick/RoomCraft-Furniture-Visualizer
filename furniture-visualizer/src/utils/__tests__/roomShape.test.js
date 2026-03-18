import {
  clampPointWithinRoom,
  getRoomClipPath,
  getRoomCutout,
  getRoomPolygonPoints,
  getRoomWallSegments,
  isBoundsInsideRoom,
  isLShapedRoom,
  isPointInsideRoom,
} from '../roomShape'

describe('roomShape', () => {
  it('detects L-shaped rooms and builds a cutout', () => {
    const room = { shape: 'L-shaped', width: 10, depth: 8 }

    expect(isLShapedRoom(room)).toBe(true)
    expect(getRoomCutout(room)).toMatchObject({
      x: 6.2,
      y: 0,
      width: 3.8,
      depth: 3.36,
      right: 10,
      bottom: 3.36,
    })
  })

  it('builds polygon points and clip paths for rectangular and L-shaped rooms', () => {
    expect(getRoomPolygonPoints({ shape: 'Rectangle', width: 5, depth: 4 })).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ])

    expect(getRoomPolygonPoints({ shape: 'L-shaped', width: 10, depth: 8 })).toHaveLength(6)
    expect(getRoomClipPath({ shape: 'Rectangle', width: 5, depth: 4 })).toBe(
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    )
  })

  it('returns wall segments for L-shaped rooms including inner walls', () => {
    const walls = getRoomWallSegments({ shape: 'L-shaped', width: 10, depth: 8 })

    expect(walls.map((wall) => wall.wall)).toEqual([
      'top',
      'inner-vertical',
      'inner-horizontal',
      'right',
      'bottom',
      'left',
    ])
  })

  it('checks points and bounds against room cutouts', () => {
    const room = { shape: 'L-shaped', width: 10, depth: 8 }

    expect(isPointInsideRoom(room, 1, 1)).toBe(true)
    expect(isPointInsideRoom(room, 9, 1)).toBe(false)

    expect(isBoundsInsideRoom(room, { left: 1, top: 1, right: 2, bottom: 2 })).toBe(true)
    expect(
      isBoundsInsideRoom(room, { left: 7, top: 0.5, right: 8, bottom: 1.5 }),
    ).toBe(false)
  })

  it('clamps points out of the L-shaped cutout', () => {
    const room = { shape: 'L-shaped', width: 10, depth: 8 }

    expect(clampPointWithinRoom(room, 6.5, 0.5)).toEqual({ x: 6.2, y: 0.5 })
    expect(clampPointWithinRoom(room, 9, 1)).toEqual({ x: 9, y: 3.36 })
  })
})
