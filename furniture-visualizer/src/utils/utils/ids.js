export const createId = () =>
  `id-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
