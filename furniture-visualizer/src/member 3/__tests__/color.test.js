import { shadeColor } from '../color'

describe('shadeColor', () => {
  it('darkens a hex color by the requested amount', () => {
    expect(shadeColor('#FFFFFF', 0.5)).toBe('rgb(128, 128, 128)')
    expect(shadeColor('#804020', 0)).toBe('rgb(128, 64, 32)')
  })

  it('clamps the shade value', () => {
    expect(shadeColor('#FFFFFF', 2)).toBe('rgb(38, 38, 38)')
  })
})
