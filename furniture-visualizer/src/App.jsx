import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Landing from './components/Landing'
import Login from './member 1/Login'
import Dashboard from './member 4/Dashboard'
import Catalog from './member 2/Catalog'
import MyDesigns from './member 4/MyDesigns'
import NewDesign from './member 1/NewDesign'
import Editor from './components/editor/Editor'
import Profile from './components/Profile'
import Help from './components/Help'
import Accessibility from './components/Accessibility'
import AppShell from './components/layout/AppShell'
import { useNotifications } from './member 4/NotificationProvider'
import { FURNITURE_CATALOG } from './member 3/catalog'
import { STORAGE_KEYS } from './member 1/constants'
import { createNewDesign } from './member 1/designs'
import {
  clearAuthSession,
  loadAuthSession,
  loadFromStorage,
  saveAuthSession,
  saveToStorage,
} from './member 1/storage'
import { normalizeDesignSizes } from './member 1/normalizeDesign'
import {
  createDesign as createDesignRequest,
  deleteDesign as deleteDesignRequest,
  getCurrentUser,
  getDesigns,
  isUnauthorizedError,
  loginUser,
  registerUser,
  updateCurrentUser,
  updateDesign as updateDesignRequest,
} from './services/api'

const ROUTES = [
  'landing',
  'login',
  'dashboard',
  'catalog',
  'designs',
  'new-design',
  'editor',
  'editor-2d',
  'view-design',
  'viewer-3d',
  'profile',
  'help',
  'accessibility',
]

const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
}

const getStoredToken = () => loadAuthSession()?.token || ''
const DESIGN_ROUTES = ['editor', 'editor-2d', 'view-design', 'viewer-3d']

const getHistoryRouteState = () => {
  if (typeof window === 'undefined') return null
  const state = window.history.state
  if (!state || !ROUTES.includes(state.route)) return null
  return {
    route: state.route,
    currentId: typeof state.currentId === 'string' ? state.currentId : null,
  }
}

const mergeCatalog = (storedCatalog) => {
  if (!Array.isArray(storedCatalog) || !storedCatalog.length) {
    return FURNITURE_CATALOG
  }

  const storedMap = new Map(storedCatalog.map((item) => [item.id, item]))
  return FURNITURE_CATALOG.map((item) => ({ ...item, ...(storedMap.get(item.id) || {}) }))
}

export default function App() {
  const initialHistoryState = getHistoryRouteState()
  const [sessionToken, setSessionToken] = useState(getStoredToken)
  const [user, setUser] = useState(null)
  const [designs, setDesigns] = useState([])
  const [route, setRoute] = useState(
    () => initialHistoryState?.route || (getStoredToken() ? 'dashboard' : 'landing'),
  )
  const [currentId, setCurrentId] = useState(() => initialHistoryState?.currentId || null)
  const [accessibility, setAccessibility] = useState(() =>
    loadFromStorage(STORAGE_KEYS.accessibility, DEFAULT_ACCESSIBILITY),
  )
  const [catalog, setCatalog] = useState(() =>
    mergeCatalog(loadFromStorage(STORAGE_KEYS.catalog, FURNITURE_CATALOG)),
  )
  const [appReady, setAppReady] = useState(() => !getStoredToken())
  const [authPending, setAuthPending] = useState(false)
  const [creatingDesign, setCreatingDesign] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [savingDesignId, setSavingDesignId] = useState(null)
  const { notify } = useNotifications()
  const notifyRef = useRef(notify)
  const historyModeRef = useRef('replace')
  const historyReadyRef = useRef(false)
  const isPopStateRef = useRef(false)

  const navigateTo = (nextRoute, { replace = false, designId } = {}) => {
    if (!ROUTES.includes(nextRoute)) return
    historyModeRef.current = replace ? 'replace' : 'push'
    if (designId !== undefined) {
      setCurrentId(designId)
    }
    setRoute(nextRoute)
  }

  useEffect(() => {
    notifyRef.current = notify
  }, [notify])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handlePopState = (event) => {
      const nextRoute = ROUTES.includes(event.state?.route)
        ? event.state.route
        : getStoredToken()
          ? 'dashboard'
          : 'landing'

      isPopStateRef.current = true
      setCurrentId(typeof event.state?.currentId === 'string' ? event.state.currentId : null)
      setRoute(nextRoute)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const historyState = {
      route,
      currentId: DESIGN_ROUTES.includes(route) ? currentId : null,
    }

    if (isPopStateRef.current) {
      isPopStateRef.current = false
      return
    }

    if (!historyReadyRef.current) {
      window.history.replaceState(historyState, '')
      historyReadyRef.current = true
      historyModeRef.current = 'push'
      return
    }

    if (
      window.history.state?.route === historyState.route &&
      window.history.state?.currentId === historyState.currentId
    ) {
      historyModeRef.current = 'push'
      return
    }

    if (historyModeRef.current === 'replace') {
      window.history.replaceState(historyState, '')
    } else {
      window.history.pushState(historyState, '')
    }
    historyModeRef.current = 'push'
  }, [currentId, route])

  useEffect(() => {
    if (!designs.length) {
      historyModeRef.current = 'replace'
      setCurrentId(null)
      return
    }

    if (!currentId || !designs.some((design) => design.id === currentId)) {
      historyModeRef.current = 'replace'
      setCurrentId(designs[0].id)
    }
  }, [currentId, designs])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.catalog, catalog)
  }, [catalog])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.accessibility, accessibility)
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('a11y-contrast', accessibility.highContrast)
      root.classList.toggle('a11y-large-text', accessibility.largeText)
      root.classList.toggle('a11y-reduced-motion', accessibility.reducedMotion)
    }
  }, [accessibility])

  useEffect(() => {
    if (!sessionToken) {
      setAppReady(true)
      return
    }
    setAppReady(false)

    let cancelled = false

    Promise.all([getCurrentUser(sessionToken), getDesigns(sessionToken)])
      .then(([nextUser, nextDesigns]) => {
        if (cancelled) return

        setUser(nextUser)
        setDesigns(nextDesigns.map((design) => normalizeDesignSizes(design)))
        setRoute((previousRoute) => {
          if (['landing', 'login'].includes(previousRoute)) {
            historyModeRef.current = 'replace'
            return 'dashboard'
          }
          return previousRoute
        })
      })
      .catch((error) => {
        if (cancelled) return

        clearAuthSession()
        setSessionToken('')
        setUser(null)
        setDesigns([])
        setCurrentId(null)
        navigateTo('login', { replace: true })
        notifyRef.current(
          isUnauthorizedError(error)
            ? 'Your session expired. Please sign in again.'
            : error.message || 'Unable to connect to the backend.',
          'warning',
          'Authentication',
        )
      })
      .finally(() => {
        if (!cancelled) {
          setAppReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [sessionToken])

  useEffect(() => {
    if (appReady && !sessionToken && !['landing', 'login'].includes(route)) {
      navigateTo('login', { replace: true })
    }
  }, [appReady, route, sessionToken])

  const currentDesign = designs.find((design) => design.id === currentId) || null

  const breadcrumbs = useMemo(() => {
    const labels = {
      dashboard: 'Dashboard',
      catalog: 'Furniture Catalog',
      designs: 'My Designs',
      'new-design': 'New Design',
      editor: 'Edit Existing Design',
      'editor-2d': '2D Layout Editor',
      'view-design': 'View Saved Design',
      'viewer-3d': '3D Viewer',
      profile: 'Profile & Settings',
      help: 'Help & Documentation',
      accessibility: 'Accessibility Settings',
    }
    const label = labels[route] || 'Dashboard'
    return ['RoomCraft', label]
  }, [route])

  const clearSessionState = (nextRoute = 'login') => {
    clearAuthSession()
    setSessionToken('')
    setUser(null)
    setDesigns([])
    setCurrentId(null)
    navigateTo(nextRoute, { replace: true, designId: null })
    setAppReady(true)
  }

  const handleApiError = (error, title) => {
    if (isUnauthorizedError(error)) {
      clearSessionState('login')
      notify('Your session expired. Please sign in again.', 'warning', 'Session expired')
      return
    }

    notify(error.message || 'Something went wrong.', 'warning', title)
  }

  const handleAuthSubmit = async ({ mode, name, email, password, remember }) => {
    setAuthPending(true)

    try {
      const payload =
        mode === 'register'
          ? { name: name || 'Designer', email, password }
          : { email, password }
      const response =
        mode === 'register'
          ? await registerUser(payload)
          : await loginUser(payload)

      clearAuthSession()
      saveAuthSession({ token: response.token }, { persistent: remember })
      setAppReady(false)
      setUser(response.user)
      setDesigns([])
      setCurrentId(null)
      setSessionToken(response.token)
      navigateTo('dashboard', { replace: true, designId: null })
      notify(
        mode === 'register'
          ? `Account created for ${response.user.name}`
          : `Welcome back, ${response.user.name}`,
        'success',
        mode === 'register' ? 'Registered' : 'Signed In',
      )
    } catch (error) {
      handleApiError(error, mode === 'register' ? 'Registration' : 'Sign in')
      throw error
    } finally {
      setAuthPending(false)
    }
  }

  const handleLogout = () => {
    clearSessionState('landing')
  }

  const handleCreateDesign = async (payload) => {
    if (!sessionToken) return

    setCreatingDesign(true)
    try {
      const draft = createNewDesign(payload)
      const savedDesign = normalizeDesignSizes(
        await createDesignRequest(sessionToken, draft),
      )

      setDesigns((previousDesigns) => [savedDesign, ...previousDesigns])
      navigateTo('editor-2d', { designId: savedDesign.id })
      notify(`"${savedDesign.name}" is ready for editing.`, 'success', 'Design created')
    } catch (error) {
      handleApiError(error, 'Design')
    } finally {
      setCreatingDesign(false)
    }
  }

  const handleUpdateDesign = (nextDesign) => {
    setDesigns((previousDesigns) =>
      previousDesigns.map((design) => (design.id === nextDesign.id ? nextDesign : design)),
    )
  }

  const handleUpdateCatalogItem = (itemId, changes) => {
    setCatalog((previousCatalog) =>
      previousCatalog.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    )
    setDesigns((previousDesigns) =>
      previousDesigns.map((design) => ({
        ...design,
        items: design.items.map((item) =>
          item.type === itemId
            ? {
                ...item,
                label: changes.name ?? item.label,
              }
            : item,
        ),
      })),
    )
    notify('Catalog item updated.', 'success', 'Catalog')
  }

  const handleDeleteDesign = async (designId) => {
    const target = designs.find((design) => design.id === designId)
    if (!target || !sessionToken) return
    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return

    try {
      await deleteDesignRequest(sessionToken, designId)
      setDesigns((previousDesigns) =>
        previousDesigns.filter((design) => design.id !== designId),
      )
      if (currentId === designId) {
        setCurrentId(null)
        navigateTo('designs', { replace: true, designId: null })
      }
      notify(`"${target.name}" was deleted.`, 'warning', 'Design removed')
    } catch (error) {
      handleApiError(error, 'Design')
    }
  }

  const handleSaveDesign = async (designId) => {
    if (!sessionToken) return

    const designToSave = designs.find((design) => design.id === designId)
    if (!designToSave) return

    setSavingDesignId(designId)
    try {
      const savedDesign = normalizeDesignSizes(
        await updateDesignRequest(sessionToken, designId, designToSave),
      )

      setDesigns((previousDesigns) =>
        previousDesigns.map((design) => (design.id === designId ? savedDesign : design)),
      )
      notify('Your changes have been saved.', 'success', 'Design saved')
    } catch (error) {
      handleApiError(error, 'Design')
    } finally {
      setSavingDesignId(null)
    }
  }

  const handleUpdateUser = async (payload) => {
    if (!sessionToken) {
      throw new Error('You are not signed in.')
    }

    setProfileSaving(true)
    try {
      const nextUser = await updateCurrentUser(sessionToken, payload)
      setUser(nextUser)
      return nextUser
    } catch (error) {
      handleApiError(error, 'Profile')
      throw error
    } finally {
      setProfileSaving(false)
    }
  }

  const openDesign = (id, nextRoute) => {
    navigateTo(nextRoute, { designId: id })
  }

  const handleOpenDesign = (id) => openDesign(id, 'editor')
  const handleViewDesign = (id) => openDesign(id, 'view-design')
  const handleView3d = (id) => openDesign(id, 'viewer-3d')

  const navigate = (nextRoute) => {
    navigateTo(nextRoute)
  }

  const activeNav = ['editor', 'view-design', 'viewer-3d'].includes(route)
    ? 'designs'
    : route === 'editor-2d'
      ? 'new-design'
      : route

  const isEditorRoute = ['editor', 'editor-2d', 'view-design', 'viewer-3d'].includes(route)

  if (!appReady) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card card">
          <span className="tag">Backend Sync</span>
          <h2>Connecting to RoomCraft</h2>
          <p>Loading your account, saved designs, and profile information.</p>
        </div>
      </div>
    )
  }

  if (route === 'landing') {
    return (
      <Landing
        onLogin={() => navigateTo('login')}
        onStart={() => navigateTo(sessionToken ? 'dashboard' : 'login')}
      />
    )
  }

  if (route === 'login') {
    return <Login onSubmit={handleAuthSubmit} isSubmitting={authPending} />
  }

  return (
    <AppShell
      active={activeNav}
      user={user}
      onNavigate={navigate}
      onLogout={handleLogout}
      breadcrumbs={breadcrumbs}
      contentClassName={isEditorRoute ? 'editor-content' : ''}
    >
      {route === 'dashboard' && (
        <Dashboard
          user={user}
          designs={designs}
          onNewDesign={() => navigateTo('new-design')}
          onOpen={handleOpenDesign}
          onNavigate={navigate}
        />
      )}
      {route === 'catalog' && (
        <Catalog catalog={catalog} onUpdateItem={handleUpdateCatalogItem} />
      )}
      {route === 'designs' && (
        <MyDesigns
          designs={designs}
          onOpen={handleOpenDesign}
          onView={handleViewDesign}
          onView3d={handleView3d}
          onDelete={handleDeleteDesign}
          onNewDesign={() => navigateTo('new-design')}
        />
      )}
      {route === 'new-design' && (
        <NewDesign onCreate={handleCreateDesign} isSubmitting={creatingDesign} />
      )}
      {route === 'editor' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => navigateTo('designs')}
          onLogout={handleLogout}
          isSavingDesign={savingDesignId === currentDesign?.id}
        />
      )}
      {route === 'editor-2d' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => navigateTo('dashboard')}
          onLogout={handleLogout}
          initialViewMode="2d"
          allowViewToggle
          isSavingDesign={savingDesignId === currentDesign?.id}
        />
      )}
      {route === 'view-design' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => navigateTo('designs')}
          readOnly
          initialViewMode="2d"
          allowViewToggle
          isSavingDesign={savingDesignId === currentDesign?.id}
        />
      )}
      {route === 'viewer-3d' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => navigateTo('designs')}
          readOnly
          initialViewMode="3d"
          allowViewToggle={false}
          isSavingDesign={savingDesignId === currentDesign?.id}
        />
      )}
      {route === 'profile' && (
        <Profile
          user={user}
          designs={designs}
          onUpdateUser={handleUpdateUser}
          isSaving={profileSaving}
        />
      )}
      {route === 'help' && <Help />}
      {route === 'accessibility' && (
        <Accessibility settings={accessibility} onUpdate={setAccessibility} />
      )}
    </AppShell>
  )
}
