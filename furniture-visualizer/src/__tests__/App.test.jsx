import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { STORAGE_KEYS } from '../member 1/constants'
import { NotificationProvider } from '../member 4/NotificationProvider'
import { createTestDesign, createTestUser } from '../test/fixtures'

const api = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(message, status) {
      super(message)
      this.name = 'ApiError'
      this.status = status
    }
  }

  return {
    MockApiError,
    createDesign: vi.fn(),
    deleteDesign: vi.fn(),
    getCurrentUser: vi.fn(),
    getDesigns: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    updateCurrentUser: vi.fn(),
    updateDesign: vi.fn(),
  }
})

const storage = vi.hoisted(() => ({
  clearAuthSession: vi.fn(),
  loadAuthSession: vi.fn(),
  loadFromStorage: vi.fn(),
  saveAuthSession: vi.fn(),
  saveToStorage: vi.fn(),
}))

vi.mock('../services/api', () => ({
  ApiError: api.MockApiError,
  createDesign: api.createDesign,
  deleteDesign: api.deleteDesign,
  getCurrentUser: api.getCurrentUser,
  getDesigns: api.getDesigns,
  isUnauthorizedError: (error) => error instanceof api.MockApiError && error.status === 401,
  loginUser: api.loginUser,
  registerUser: api.registerUser,
  updateCurrentUser: api.updateCurrentUser,
  updateDesign: api.updateDesign,
}))

vi.mock('../member 1/storage', () => ({
  clearAuthSession: storage.clearAuthSession,
  loadAuthSession: storage.loadAuthSession,
  loadFromStorage: storage.loadFromStorage,
  saveAuthSession: storage.saveAuthSession,
  saveToStorage: storage.saveToStorage,
}))

vi.mock('../components/Landing', () => ({
  default: ({ onLogin, onStart }) => (
    <div>
      <div>Landing Screen</div>
      <button type="button" onClick={onLogin}>
        Go Login
      </button>
      <button type="button" onClick={onStart}>
        Go Start
      </button>
    </div>
  ),
}))

vi.mock('../member 1/Login', () => ({
  default: ({ onSubmit, isSubmitting }) => (
    <div>
      <div>Login Screen</div>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() =>
          onSubmit({
            mode: 'login',
            name: '',
            email: 'jamie@example.com',
            password: 'secret123',
            remember: true,
          })
        }
      >
        Submit Login
      </button>
    </div>
  ),
}))

vi.mock('../member 4/Dashboard', () => ({
  default: ({ designs, onNewDesign }) => (
    <div>
      <div>Dashboard Screen</div>
      <div>{`Design Count:${designs.length}`}</div>
      <button type="button" onClick={onNewDesign}>
        Go New Design
      </button>
    </div>
  ),
}))

vi.mock('../member 2/Catalog', () => ({
  default: ({ onUpdateItem }) => (
    <div>
      <div>Catalog Screen</div>
      <button
        type="button"
        onClick={() =>
          onUpdateItem('furniture-12', {
            name: 'Chair Deluxe',
            width: 0.7,
            depth: 0.67,
            height: 0.52,
            color: '#123456',
          })
        }
      >
        Update Catalog Item
      </button>
    </div>
  ),
}))

vi.mock('../member 4/MyDesigns', () => ({
  default: ({ designs, onOpen, onDelete }) => (
    <div>
      <div>My Designs Screen</div>
      <button type="button" onClick={() => onOpen(designs[0].id)}>
        Open First Design
      </button>
      <button type="button" onClick={() => onDelete(designs[0].id)}>
        Delete First Design
      </button>
    </div>
  ),
}))

vi.mock('../member 1/NewDesign', () => ({
  default: ({ onCreate }) => (
    <div>
      <div>New Design Screen</div>
      <button
        type="button"
        onClick={() =>
          onCreate({
            name: 'Created Design',
            room: {
              name: 'Created Room',
              shape: 'Rectangle',
              width: 5,
              depth: 4,
              height: 2.8,
              wallColor: '#F5F0EB',
              floorColor: '#C8A882',
            },
            planType: 'single',
            roomCount: 1,
          })
        }
      >
        Create Mock Design
      </button>
    </div>
  ),
}))

vi.mock('../components/editor/Editor', () => ({
  default: ({ design, onSaveDesign, onExit }) => (
    <div>
      <div>Editor Screen</div>
      <div>{`Design:${design?.name || 'none'}`}</div>
      <div>{`Labels:${design?.items?.map((item) => item.label).join(', ') || 'none'}`}</div>
      <button type="button" onClick={() => onSaveDesign(design.id)}>
        Editor Save
      </button>
      <button type="button" onClick={onExit}>
        Editor Back
      </button>
    </div>
  ),
}))

vi.mock('../components/Profile', () => ({
  default: ({ onUpdateUser }) => (
    <div>
      <div>Profile Screen</div>
      <button
        type="button"
        onClick={() => onUpdateUser({ name: 'Updated User', email: 'updated@example.com' })}
      >
        Update Profile
      </button>
    </div>
  ),
}))

vi.mock('../components/Help', () => ({
  default: () => <div>Help Screen</div>,
}))

vi.mock('../components/Accessibility', () => ({
  default: ({ settings, onUpdate }) => (
    <div>
      <div>Accessibility Screen</div>
      <button
        type="button"
        onClick={() =>
          onUpdate({
            ...settings,
            highContrast: !settings.highContrast,
          })
        }
      >
        Toggle High Contrast
      </button>
    </div>
  ),
}))

vi.mock('../components/layout/AppShell', () => ({
  default: ({ active, breadcrumbs, onNavigate, onLogout, children }) => (
    <div>
      <div>{`Active:${active}`}</div>
      <div>{breadcrumbs.join(' / ')}</div>
      <button type="button" onClick={() => onNavigate('dashboard')}>
        Nav Dashboard
      </button>
      <button type="button" onClick={() => onNavigate('designs')}>
        Nav Designs
      </button>
      <button type="button" onClick={() => onNavigate('catalog')}>
        Nav Catalog
      </button>
      <button type="button" onClick={() => onNavigate('new-design')}>
        Nav New Design
      </button>
      <button type="button" onClick={() => onNavigate('accessibility')}>
        Nav Accessibility
      </button>
      <button type="button" onClick={onLogout}>
        Nav Logout
      </button>
      {children}
    </div>
  ),
}))

function renderApp() {
  return render(
    <NotificationProvider>
      <App />
    </NotificationProvider>,
  )
}

describe('App', () => {
  beforeEach(() => {
    const user = createTestUser()
    const design = createTestDesign()

    storage.clearAuthSession.mockReset()
    storage.loadAuthSession.mockReset()
    storage.loadFromStorage.mockReset()
    storage.saveAuthSession.mockReset()
    storage.saveToStorage.mockReset()

    api.createDesign.mockReset()
    api.deleteDesign.mockReset()
    api.getCurrentUser.mockReset()
    api.getDesigns.mockReset()
    api.loginUser.mockReset()
    api.registerUser.mockReset()
    api.updateCurrentUser.mockReset()
    api.updateDesign.mockReset()

    storage.loadAuthSession.mockReturnValue(null)
    storage.loadFromStorage.mockImplementation((_key, fallback) => fallback)

    api.loginUser.mockResolvedValue({ token: 'token-1', user })
    api.getCurrentUser.mockResolvedValue(user)
    api.getDesigns.mockResolvedValue([design])
    api.createDesign.mockResolvedValue({
      ...createTestDesign({ id: 'design-2', name: 'Created Design', items: [] }),
    })
    api.deleteDesign.mockResolvedValue(null)

    window.confirm = vi.fn(() => true)
  })

  it('hydrates the dashboard from an existing session token', async () => {
    storage.loadAuthSession.mockReturnValue({ token: 'token-1' })

    renderApp()

    expect(screen.getByText('Connecting to RoomCraft')).toBeInTheDocument()
    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument()
    expect(screen.getByText('Design Count:1')).toBeInTheDocument()
    expect(api.getCurrentUser).toHaveBeenCalledWith('token-1')
    expect(api.getDesigns).toHaveBeenCalledWith('token-1')
  })

  it('clears the session and returns to login when bootstrap auth is unauthorized', async () => {
    storage.loadAuthSession.mockReturnValue({ token: 'expired-token' })
    api.getCurrentUser.mockRejectedValue(new api.MockApiError('Expired', 401))

    renderApp()

    expect(await screen.findByText('Login Screen')).toBeInTheDocument()
    expect(storage.clearAuthSession).toHaveBeenCalled()
    expect(
      await screen.findByText('Your session expired. Please sign in again.'),
    ).toBeInTheDocument()
  })

  it('signs in from the landing page and persists accessibility changes', async () => {
    const user = userEvent.setup()

    renderApp()

    expect(screen.getByText('Landing Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go Start' }))
    expect(screen.getByText('Login Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Submit Login' }))
    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument()
    expect(storage.saveAuthSession).toHaveBeenCalledWith(
      { token: 'token-1' },
      { persistent: true },
    )

    await user.click(screen.getByRole('button', { name: 'Nav Accessibility' }))
    await user.click(screen.getByRole('button', { name: 'Toggle High Contrast' }))

    expect(document.documentElement).toHaveClass('a11y-contrast')
    expect(storage.saveToStorage).toHaveBeenLastCalledWith(STORAGE_KEYS.accessibility, {
      highContrast: true,
      largeText: false,
      reducedMotion: false,
    })
  })

  it('updates catalog labels in existing designs and opens the editor for new designs', async () => {
    const user = userEvent.setup()

    storage.loadAuthSession.mockReturnValue({ token: 'token-1' })
    renderApp()

    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nav Catalog' }))
    await user.click(screen.getByRole('button', { name: 'Update Catalog Item' }))

    await user.click(screen.getByRole('button', { name: 'Nav Designs' }))
    await user.click(screen.getByRole('button', { name: 'Open First Design' }))

    expect(await screen.findByText('Editor Screen')).toBeInTheDocument()
    expect(screen.getByText('Labels:Chair Deluxe')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nav New Design' }))
    await user.click(screen.getByRole('button', { name: 'Create Mock Design' }))

    await waitFor(() => expect(api.createDesign).toHaveBeenCalledWith('token-1', expect.any(Object)))
    expect(await screen.findByText('Design:Created Design')).toBeInTheDocument()
  })
})
