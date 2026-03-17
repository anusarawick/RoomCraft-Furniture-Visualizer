import { formatDate } from '../format'

describe('formatDate', () => {
  it('formats saved timestamps and handles empty values', () => {
    expect(formatDate('2025-03-12T09:00:00.000Z')).toContain('2025')
    expect(formatDate('')).toBe('Not saved yet')
  })
})
