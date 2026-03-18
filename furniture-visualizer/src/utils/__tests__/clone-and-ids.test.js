import { cloneDesign } from '../clone'
import { createId } from '../ids'

describe('clone and ids', () => {
  it('deep clones a design', () => {
    const design = { id: 'design-1', items: [{ id: 'item-1', x: 1 }] }
    const cloned = cloneDesign(design)

    cloned.items[0].x = 5

    expect(design.items[0].x).toBe(1)
  })

  it('falls back when structuredClone is unavailable', () => {
    const originalStructuredClone = globalThis.structuredClone
    globalThis.structuredClone = undefined

    const design = { id: 'design-1', items: [{ id: 'item-1', x: 1 }] }
    const cloned = cloneDesign(design)

    globalThis.structuredClone = originalStructuredClone

    expect(cloned).toEqual(design)
    expect(cloned).not.toBe(design)
  })

  it('creates unique ids', () => {
    const first = createId()
    const second = createId()

    expect(first).toMatch(/^id-[a-z0-9]{7}-[a-z0-9]+$/)
    expect(second).not.toBe(first)
  })
})
