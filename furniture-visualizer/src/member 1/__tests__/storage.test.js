import { STORAGE_KEYS } from '../constants'
import {
  clearAuthSession,
  loadAuthSession,
  loadFromStorage,
  saveAuthSession,
  saveToStorage,
} from '../storage'

describe('storage helpers', () => {
  it('loads and saves arbitrary JSON values', () => {
    saveToStorage('test-key', { enabled: true })

    expect(loadFromStorage('test-key', null)).toEqual({ enabled: true })
    expect(loadFromStorage('missing-key', 'fallback')).toBe('fallback')
  })

  it('persists auth sessions to localStorage or sessionStorage', () => {
    saveAuthSession({ token: 'persistent-token' }, { persistent: true })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.authSession))).toEqual({
      token: 'persistent-token',
    })
    expect(loadAuthSession()).toEqual({ token: 'persistent-token' })

    saveAuthSession({ token: 'session-token' }, { persistent: false })
    expect(localStorage.getItem(STORAGE_KEYS.authSession)).toBeNull()
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEYS.authSession))).toEqual({
      token: 'session-token',
    })
  })

  it('clears auth-related storage keys', () => {
    localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify({ token: 'x' }))
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ id: 'user-1' }))
    localStorage.setItem(STORAGE_KEYS.designs, JSON.stringify([]))
    sessionStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify({ token: 'y' }))

    clearAuthSession()

    expect(localStorage.getItem(STORAGE_KEYS.authSession)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.user)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.designs)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEYS.authSession)).toBeNull()
  })
})
