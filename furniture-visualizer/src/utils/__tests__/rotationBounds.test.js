import { isBoundsInsideRoom } from '../roomShape'
import {
  clampItemWithinRoom,
  getRotatedFootprint,
  normalizeRotation,
} from '../rotationBounds'

describe('rotationBounds', () => {
  it('normalizes arbitrary rotation values', () => {
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation('bad')).toBe(0)
  })

  it('computes the rotated footprint', () => {
    const footprint = getRotatedFootprint(2, 1, 90)

    expect(footprint.width).toBeCloseTo(1)
    expect(footprint.depth).toBeCloseTo(2)
  })

  it('clamps items within a rectangular room', () => {
    const nextItem = clampItemWithinRoom(
      { width: 1, depth: 1, x: 4.8, y: 3.9, rotation: 450 },
      { width: 5, depth: 4 },
    )

    expect(nextItem).toMatchObject({ x: 4, y: 3, rotation: 90 })
  })

  it('keeps rotated items inside an L-shaped room by choosing a valid candidate', () => {
    const room = { shape: 'L-shaped', width: 6, depth: 5 }
    const nextItem = clampItemWithinRoom(
      { width: 2, depth: 2, x: 4.3, y: 0.2, rotation: 0 },
      room,
    )

    expect(
      isBoundsInsideRoom(room, {
        left: nextItem.x,
        top: nextItem.y,
        right: nextItem.x + nextItem.width,
        bottom: nextItem.y + nextItem.depth,
      }),
    ).toBe(true)
  })
})
