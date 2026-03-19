const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : null

  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed.', response.status, data)
  }

  return data
}

export const isUnauthorizedError = (error) =>
  error instanceof ApiError && error.status === 401

export const registerUser = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: payload,
  })

export const loginUser = (payload) =>
  request('/auth/login', {
    method: 'POST',
    body: payload,
  })

export const getCurrentUser = (token) =>
  request('/users/me', {
    token,
  })

export const updateCurrentUser = (token, payload) =>
  request('/users/me', {
    method: 'PUT',
    token,
    body: payload,
  })

export const getRegisteredUsers = (token) =>
  request('/users', {
    token,
  })

export const getDesigns = (token) =>
  request('/designs', {
    token,
  })

export const createDesign = (token, payload) =>
  request('/designs', {
    method: 'POST',
    token,
    body: payload,
  })

export const updateDesign = (token, designId, payload) =>
  request(`/designs/${designId}`, {
    method: 'PUT',
    token,
    body: payload,
  })

export const deleteDesign = (token, designId) =>
  request(`/designs/${designId}`, {
    method: 'DELETE',
    token,
  })

export const getTemplates = (token) =>
  request('/designs/templates', {
    token,
  })

export const createTemplate = (token, payload) =>
  request('/designs/templates', {
    method: 'POST',
    token,
    body: payload,
  })

export const updateTemplate = (token, designId, payload) =>
  request(`/designs/templates/${designId}`, {
    method: 'PUT',
    token,
    body: payload,
  })

export const deleteTemplate = (token, designId) =>
  request(`/designs/templates/${designId}`, {
    method: 'DELETE',
    token,
  })

export const getCollection = (token) =>
  request('/designs/collection', {
    token,
  })

export const purchaseTemplate = (token, designId) =>
  request(`/designs/templates/${designId}/purchase`, {
    method: 'POST',
    token,
  })
