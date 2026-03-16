export const STORAGE_KEYS = {
  user: 'fv-user',
  designs: 'fv-designs',
  accessibility: 'fv-accessibility',
}

export const DEFAULT_ROOM = {
  name: 'Living Room',
  width: 5.4,
  depth: 4.2,
  height: 2.7,
  wallColor: '#F5EDE3',
  floorColor: '#C9B8A0',
  shape: 'Rectangle',
  x: 0,
  y: 0,
}

export const ROOM_SHAPES = ['Rectangle', 'L-shaped']

export const WALL_COLOR_PRESETS = [
  { name: 'Soft Ivory', value: '#F5F0EB' },
  { name: 'Warm Linen', value: DEFAULT_ROOM.wallColor },
  { name: 'Greige', value: '#DDD5CB' },
  { name: 'Sage Mist', value: '#D8DED1' },
  { name: 'Cloud Grey', value: '#E5E1DA' },
]

export const FLOOR_COLOR_PRESETS = [
  { name: 'Honey Oak', value: '#C8A882' },
  { name: 'Natural Wood', value: DEFAULT_ROOM.floorColor },
  { name: 'Sandstone', value: '#D4C1A8' },
  { name: 'Walnut', value: '#B48A66' },
  { name: 'Espresso', value: '#8E694E' },
]

export const ACCENT_COLOR_PRESETS = [
  { name: 'Terracotta', value: '#C97C5D' },
  { name: 'Clay Rose', value: '#B56A5A' },
  { name: 'Golden Oak', value: '#D4A373' },
  { name: 'Olive Leaf', value: '#8A9A76' },
  { name: 'Slate Blue', value: '#5D7083' },
]

export const ITEM_COLOR_PRESETS = [
  { name: 'Canvas', value: '#E6E0D8' },
  { name: 'Oak', value: '#C9A47A' },
  { name: 'Terracotta', value: '#C97C5D' },
  { name: 'Walnut', value: '#8B7763' },
  { name: 'Charcoal Blue', value: '#4C5A63' },
]

