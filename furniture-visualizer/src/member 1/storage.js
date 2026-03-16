import { STORAGE_KEYS } from './constants'

export const loadFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const removeKey = (storage, key) => {
  try {
    storage.removeItem(key)
  } catch {
    return
  }
}

const loadJson = (storage, key) => {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const loadAuthSession = () => {
  if (typeof window === 'undefined') return null

  return (
    loadJson(localStorage, STORAGE_KEYS.authSession) ||
    loadJson(sessionStorage, STORAGE_KEYS.authSession)
  )
}

export const saveAuthSession = (session, { persistent = true } = {}) => {
  if (typeof window === 'undefined') return

  removeKey(localStorage, STORAGE_KEYS.authSession)
  removeKey(sessionStorage, STORAGE_KEYS.authSession)

  const storage = persistent ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEYS.authSession, JSON.stringify(session))
}

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return

  removeKey(localStorage, STORAGE_KEYS.authSession)
  removeKey(sessionStorage, STORAGE_KEYS.authSession)
  removeKey(localStorage, STORAGE_KEYS.user)
  removeKey(localStorage, STORAGE_KEYS.designs)
}
