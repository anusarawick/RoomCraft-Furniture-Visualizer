import { clamp } from '../member 2/clamp'

const hexToRgb = (hex) => {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return { r: 0, g: 0, b: 0 }
  const num = parseInt(cleaned, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export const shadeColor = (hex, shade) => {
  const { r, g, b } = hexToRgb(hex)
  const intensity = clamp(shade, 0, 0.85)
  const shaded = {
    r: Math.round(r * (1 - intensity)),
    g: Math.round(g * (1 - intensity)),
    b: Math.round(b * (1 - intensity)),
  }
  return `rgb(${shaded.r}, ${shaded.g}, ${shaded.b})`
}

