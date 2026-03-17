import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : ''

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.auth = { userId: payload.sub }
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' })
  }
}
