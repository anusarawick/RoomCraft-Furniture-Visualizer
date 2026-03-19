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
    createTemplate: vi.fn(),
    deleteDesign: vi.fn(),
    deleteTemplate: vi.fn(),
    getCollection: vi.fn(),
    getCurrentUser: vi.fn(),
    getDesigns: vi.fn(),
    getRegisteredUsers: vi.fn(),
    getTemplates: vi.fn(),
    loginUser: vi.fn(),
    purchaseTemplate: vi.fn(),
    registerUser: vi.fn(),
    updateCurrentUser: vi.fn(),
    updateDesign: vi.fn(),
    updateTemplate: vi.fn(),
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
  createTemplate: api.createTemplate,
  deleteDesign: api.deleteDesign,
  deleteTemplate: api.deleteTemplate,
  getCollection: api.getCollection,
  getCurrentUser: api.getCurrentUser,
  getDesigns: api.getDesigns,
  getRegisteredUsers: api.getRegisteredUsers,
  getTemplates: api.getTemplates,
  isUnauthorizedError: (error) => error instanceof api.MockApiError && error.status === 401,
  loginUser: api.loginUser,
  purchaseTemplate: api.purchaseTemplate,
  registerUser: api.registerUser,
  updateCurrentUser: api.updateCurrentUser,
  updateDesign: api.updateDesign,
  updateTemplate: api.updateTemplate,
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

vi.mock('../admin/AdminDashboard', () => ({
  default: ({ templates, registeredUsers }) => (
    <div>
      <div>Admin Dashboard Screen</div>
      <div>{`Template Count:${templates.length}`}</div>
      <div>{`User Count:${registeredUsers.length}`}</div>
    </div>
  ),
}))

vi.mock('../admin/AdminUsers', () => ({
  default: ({ users }) => (
    <div>
      <div>Admin Users Screen</div>
      <div>{`Users:${users.length}`}</div>
    </div>
  ),
}))

vi.mock('../admin/AdminTemplateEditor', () => ({
  default: ({ template, onUpdateTemplate, onSaveTemplate }) => (
    <div>
      <div>Admin Template Editor Screen</div>
      <div>{`Template:${template?.name || 'none'}`}</div>
      <button
        type="button"
        onClick={() => onUpdateTemplate({ ...template, price: 199 })}
      >
        Update Template Price
      </button>
      <button type="button" onClick={() => onSaveTemplate(template.id)}>
        Save Template
      </button>
    </div>
  ),
}))

vi.mock('../admin/AdminTemplates', () => ({
  default: ({ templates }) => (
    <div>
      <div>Admin Templates Screen</div>
      <div>{`Templates:${templates.length}`}</div>
    </div>
  ),
}))

vi.mock('../customer/TemplatesMarketplace', () => ({
  default: ({ templates, purchasedIds, onPurchase }) => (
    <div>
      <div>Templates Screen</div>
      <div>{`Templates:${templates.length}`}</div>
      <div>{`Purchased:${purchasedIds.length}`}</div>
      <button type="button" onClick={() => onPurchase(templates[0]?.id)}>
        Purchase First Template
      </button>
    </div>
  ),
}))

vi.mock('../customer/CustomerCollection', () => ({
  default: ({ templates }) => (
    <div>
      <div>Collection Screen</div>
      <div>{`Collection:${templates.length}`}</div>
    </div>
  ),
}))

vi.mock('../customer/PurchaseModal', () => ({
  default: ({ onConfirm, onClose }) => (
    <div>
      <div>Purchase Modal</div>
      <button type="button" onClick={() => onConfirm({})}>
        Confirm Purchase
      </button>
      <button type="button" onClick={onClose}>
        Close Purchase
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
      <button type="button" onClick={() => onNavigate('templates')}>
        Nav Templates
      </button>
      <button type="button" onClick={() => onNavigate('collection')}>
        Nav Collection
      </button>
      <button type="button" onClick={() => onNavigate('admin-dashboard')}>
        Nav Admin Dashboard
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

    window.history.replaceState(null, '')

    storage.clearAuthSession.mockReset()
    storage.loadAuthSession.mockReset()
    storage.loadFromStorage.mockReset()
    storage.saveAuthSession.mockReset()
    storage.saveToStorage.mockReset()

    api.createDesign.mockReset()
    api.createTemplate.mockReset()
    api.deleteDesign.mockReset()
    api.deleteTemplate.mockReset()
    api.getCollection.mockReset()
    api.getCurrentUser.mockReset()
    api.getDesigns.mockReset()
    api.getRegisteredUsers.mockReset()
    api.getTemplates.mockReset()
    api.loginUser.mockReset()
    api.purchaseTemplate.mockReset()
    api.registerUser.mockReset()
    api.updateCurrentUser.mockReset()
    api.updateDesign.mockReset()
    api.updateTemplate.mockReset()

    storage.loadAuthSession.mockReturnValue(null)
    storage.loadFromStorage.mockImplementation((_key, fallback) => fallback)

    api.loginUser.mockResolvedValue({ token: 'token-1', user })
    api.getCurrentUser.mockResolvedValue(user)
    api.getDesigns.mockResolvedValue([design])
    api.getTemplates.mockResolvedValue([createTestDesign({ id: 'template-1', name: 'Template One', price: 99 })])
    api.getCollection.mockResolvedValue([])
    api.getRegisteredUsers.mockResolvedValue([])
    api.createDesign.mockResolvedValue({
      ...createTestDesign({ id: 'design-2', name: 'Created Design', items: [] }),
    })
    api.createTemplate.mockResolvedValue({
      ...createTestDesign({ id: 'template-2', name: 'Created Template', items: [], price: 149 }),
    })
    api.deleteDesign.mockResolvedValue(null)
    api.deleteTemplate.mockResolvedValue(null)
    api.purchaseTemplate.mockResolvedValue({
      purchased: true,
      template: createTestDesign({ id: 'template-1', name: 'Template One', price: 99 }),
    })

    window.confirm = vi.fn(() => true)
  })

  it('returns to the landing page when browser back is used from login', async () => {
    const user = userEvent.setup()

    renderApp()

    expect(screen.getByText('Landing Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Go Login' }))
    expect(screen.getByText('Login Screen')).toBeInTheDocument()

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))

    expect(await screen.findByText('Landing Screen')).toBeInTheDocument()
  })

  it('hydrates the dashboard from an existing session token', async () => {
    storage.loadAuthSession.mockReturnValue({ token: 'token-1' })

    renderApp()

    expect(screen.getByText('Connecting to RoomCraft')).toBeInTheDocument()
    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument()
    expect(screen.getByText('Design Count:1')).toBeInTheDocument()
    expect(api.getCurrentUser).toHaveBeenCalledWith('token-1')
    expect(api.getDesigns).toHaveBeenCalledWith('token-1')
    expect(api.getTemplates).toHaveBeenCalledWith('token-1')
    expect(api.getCollection).toHaveBeenCalledWith('token-1')
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

  it('loads the admin dashboard for the default admin account', async () => {
    const adminUser = createTestUser({
      id: 'admin-1',
      name: 'RoomCraft Admin',
      email: 'admin@roomcraft.local',
      accountType: 'admin',
    })

    storage.loadAuthSession.mockReturnValue({ token: 'admin-token' })
    api.getCurrentUser.mockResolvedValue(adminUser)
    api.getTemplates.mockResolvedValue([createTestDesign({ id: 'template-9', name: 'Admin Template' })])
    api.getRegisteredUsers.mockResolvedValue([createTestUser({ id: 'user-2' })])

    renderApp()

    expect(await screen.findByText('Admin Dashboard Screen')).toBeInTheDocument()
    expect(screen.getByText('Template Count:1')).toBeInTheDocument()
    expect(screen.getByText('User Count:1')).toBeInTheDocument()
  })

  it('adds a purchased template to the customer collection flow', async () => {
    const user = userEvent.setup()

    storage.loadAuthSession.mockReturnValue({ token: 'token-1' })
    renderApp()

    expect(await screen.findByText('Dashboard Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nav Templates' }))
    expect(await screen.findByText('Templates Screen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Purchase First Template' }))
    expect(await screen.findByText('Purchase Modal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm Purchase' }))

    expect(await screen.findByText('Collection Screen')).toBeInTheDocument()
    expect(screen.getByText('Collection:1')).toBeInTheDocument()
  })
})
