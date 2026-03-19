export const signJwtForUser = (jwt, user) =>
  jwt.sign(
    {
      sub: user.id,
      accountType: user.accountType || 'customer',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )

export const sanitizeUser = (user) => user.toJSON()

export const normalizeDesignPayload = (payload = {}) => {
  const rooms = Array.isArray(payload.rooms)
    ? payload.rooms.filter((room) => room && typeof room === 'object')
    : []
  const room =
    payload.room && typeof payload.room === 'object'
      ? payload.room
      : rooms[0] || null

  return {
    name:
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name.trim()
        : 'Untitled Design',
    price: Number.isFinite(Number(payload.price))
      ? Math.max(0, Number(payload.price))
      : 0,
    room,
    rooms: rooms.length ? rooms : room ? [room] : [],
    items: Array.isArray(payload.items)
      ? payload.items.filter((item) => item && typeof item === 'object')
      : [],
    accentColor:
      typeof payload.accentColor === 'string' && payload.accentColor.trim()
        ? payload.accentColor
        : '#C97C5D',
    accentOverrideEnabled: payload.accentOverrideEnabled === true,
    globalShade: Number.isFinite(Number(payload.globalShade))
      ? Number(payload.globalShade)
      : 0,
  }
}
