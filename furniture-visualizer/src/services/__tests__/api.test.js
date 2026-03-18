import {
  ApiError,
  createDesign,
  deleteDesign,
  getCurrentUser,
  getDesigns,
  isUnauthorizedError,
  loginUser,
  registerUser,
  updateCurrentUser,
  updateDesign,
} from '../api'

describe('api service', () => {
  it('sends JSON requests with tokens when required', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'user-1' }),
    })

    await registerUser({ email: 'test@example.com', password: 'secret' })
    await loginUser({ email: 'test@example.com', password: 'secret' })
    await getCurrentUser('token-1')
    await updateCurrentUser('token-1', { name: 'Jamie' })
    await getDesigns('token-1')
    await createDesign('token-1', { name: 'Design' })
    await updateDesign('token-1', 'design-1', { name: 'Updated' })
    await deleteDesign('token-1', 'design-1')

    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'secret' }),
    }))
    expect(fetch).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({
      headers: { Authorization: 'Bearer token-1' },
      method: 'GET',
    }))
    expect(fetch).toHaveBeenCalledWith('/api/designs/design-1', expect.objectContaining({
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-1' },
    }))
  })

  it('throws ApiError objects for failed requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Expired' }),
    })

    await expect(getCurrentUser('expired-token')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'Expired',
        status: 401,
      }),
    )
    expect(isUnauthorizedError(new ApiError('Expired', 401))).toBe(true)
    expect(isUnauthorizedError(new Error('nope'))).toBe(false)
  })
})
