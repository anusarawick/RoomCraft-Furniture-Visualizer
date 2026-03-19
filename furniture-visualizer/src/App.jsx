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
import AdminDashboard from './admin/AdminDashboard'
import AdminTemplateEditor from './admin/AdminTemplateEditor'
import AdminUsers from './admin/AdminUsers'
import AdminTemplates from './admin/AdminTemplates'
import TemplatesMarketplace from './customer/TemplatesMarketplace'
import CustomerCollection from './customer/CustomerCollection'
import PurchaseModal from './customer/PurchaseModal'
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
  createTemplate as createTemplateRequest,
  deleteDesign as deleteDesignRequest,
  deleteTemplate as deleteTemplateRequest,
  getCollection,
  getCurrentUser,
  getDesigns,
  getRegisteredUsers,
  getTemplates,
  isUnauthorizedError,
  loginUser,
  purchaseTemplate as purchaseTemplateRequest,
  registerUser,
  updateCurrentUser,
  updateDesign as updateDesignRequest,
  updateTemplate as updateTemplateRequest,
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
  'templates',
  'template-view-2d',
  'collection',
  'collection-view-2d',
  'collection-view-3d',
  'admin-dashboard',
  'admin-users',
  'admin-templates',
  'admin-new-template',
  'admin-template-editor',
  'admin-template-view-2d',
  'profile',
  'help',
  'accessibility',
]

const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
}

const PUBLIC_ROUTES = ['landing', 'login']
const CUSTOMER_ONLY_ROUTES = [
  'dashboard',
  'catalog',
  'designs',
  'new-design',
  'editor',
  'editor-2d',
  'view-design',
  'viewer-3d',
  'templates',
  'template-view-2d',
  'collection',
  'collection-view-2d',
  'collection-view-3d',
]
const ADMIN_ONLY_ROUTES = [
  'admin-dashboard',
  'admin-users',
  'admin-templates',
  'admin-new-template',
  'admin-template-editor',
  'admin-template-view-2d',
]

const getStoredToken = () => loadAuthSession()?.token || ''

const getDefaultPrivateRoute = (accountType) =>
  accountType === 'admin' ? 'admin-dashboard' : 'dashboard'

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

const normalizeDesignList = (items) => items.map((design) => normalizeDesignSizes(design))

export default function App() {
  const initialHistoryState = getHistoryRouteState()
  const [sessionToken, setSessionToken] = useState(getStoredToken)
  const [user, setUser] = useState(null)
  const [designs, setDesigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [collection, setCollection] = useState([])
  const [registeredUsers, setRegisteredUsers] = useState([])
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
  const [creatingTemplate, setCreatingTemplate] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [savingDesignId, setSavingDesignId] = useState(null)
  const [savingTemplateId, setSavingTemplateId] = useState(null)
  const [purchaseTargetId, setPurchaseTargetId] = useState(null)
  const [purchasePending, setPurchasePending] = useState(false)
  const { notify } = useNotifications()
  const notifyRef = useRef(notify)
  const historyModeRef = useRef('replace')
  const historyReadyRef = useRef(false)
  const isPopStateRef = useRef(false)

  const isAdmin = user?.accountType === 'admin'

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
      currentId: currentId || null,
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

    let cancelled = false
    setAppReady(false)

    const bootstrap = async () => {
      try {
        const nextUser = await getCurrentUser(sessionToken)
        if (cancelled) return

        if (nextUser.accountType === 'admin') {
          const [nextTemplates, nextRegisteredUsers] = await Promise.all([
            getTemplates(sessionToken),
            getRegisteredUsers(sessionToken),
          ])

          if (cancelled) return

          setUser(nextUser)
          setDesigns([])
          setTemplates(normalizeDesignList(nextTemplates))
          setCollection([])
          setRegisteredUsers(nextRegisteredUsers)
          setRoute((previousRoute) => {
            if (
              PUBLIC_ROUTES.includes(previousRoute) ||
              CUSTOMER_ONLY_ROUTES.includes(previousRoute)
            ) {
              historyModeRef.current = 'replace'
              return 'admin-dashboard'
            }
            return previousRoute
          })
          return
        }

        const [nextDesigns, nextTemplates, nextCollection] = await Promise.all([
          getDesigns(sessionToken),
          getTemplates(sessionToken),
          getCollection(sessionToken),
        ])

        if (cancelled) return

        setUser(nextUser)
        setDesigns(normalizeDesignList(nextDesigns))
        setTemplates(normalizeDesignList(nextTemplates))
        setCollection(normalizeDesignList(nextCollection))
        setRegisteredUsers([])
        setRoute((previousRoute) => {
          if (PUBLIC_ROUTES.includes(previousRoute) || ADMIN_ONLY_ROUTES.includes(previousRoute)) {
            historyModeRef.current = 'replace'
            return 'dashboard'
          }
          return previousRoute
        })
      } catch (error) {
        if (cancelled) return

        clearAuthSession()
        setSessionToken('')
        setUser(null)
        setDesigns([])
        setTemplates([])
        setCollection([])
        setRegisteredUsers([])
        setCurrentId(null)
        navigateTo('login', { replace: true })
        notifyRef.current(
          isUnauthorizedError(error)
            ? 'Your session expired. Please sign in again.'
            : error.message || 'Unable to connect to the backend.',
          'warning',
          'Authentication',
        )
      } finally {
        if (!cancelled) {
          setAppReady(true)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [sessionToken])

  useEffect(() => {
    if (appReady && !sessionToken && !PUBLIC_ROUTES.includes(route)) {
      navigateTo('login', { replace: true })
    }
  }, [appReady, route, sessionToken])

  useEffect(() => {
    if (!appReady || !sessionToken || !user) return

    if (isAdmin && CUSTOMER_ONLY_ROUTES.includes(route)) {
      navigateTo('admin-dashboard', { replace: true })
      return
    }

    if (!isAdmin && ADMIN_ONLY_ROUTES.includes(route)) {
      navigateTo('dashboard', { replace: true })
    }
  }, [appReady, isAdmin, route, sessionToken, user])

  const currentRouteItems = useMemo(() => {
    if (['editor', 'editor-2d', 'view-design', 'viewer-3d'].includes(route)) {
      return designs
    }
    if (['admin-template-editor', 'admin-template-view-2d', 'template-view-2d'].includes(route)) {
      return templates
    }
    if (['collection-view-2d', 'collection-view-3d'].includes(route)) {
      return collection
    }
    return []
  }, [collection, designs, route, templates])

  useEffect(() => {
    if (!currentRouteItems.length) {
      if (route !== 'landing' && route !== 'login') {
        historyModeRef.current = 'replace'
        setCurrentId(null)
      }
      return
    }

    if (!currentId || !currentRouteItems.some((item) => item.id === currentId)) {
      historyModeRef.current = 'replace'
      setCurrentId(currentRouteItems[0].id)
    }
  }, [currentId, currentRouteItems, route])

  const currentDesign = designs.find((design) => design.id === currentId) || null
  const currentTemplate =
    templates.find((template) => template.id === currentId) ||
    collection.find((template) => template.id === currentId) ||
    null
  const purchaseTarget = templates.find((template) => template.id === purchaseTargetId) || null
  const purchasedTemplateIds = collection.map((template) => template.id)

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
      templates: 'Templates',
      'template-view-2d': 'Template 2D Preview',
      collection: 'Customer Collection',
      'collection-view-2d': 'Collection 2D Preview',
      'collection-view-3d': 'Collection 3D Viewer',
      'admin-dashboard': 'Admin Dashboard',
      'admin-users': 'Registered Users',
      'admin-templates': 'Template Library',
      'admin-new-template': 'New Template',
      'admin-template-editor': 'Edit Template',
      'admin-template-view-2d': 'Template 2D Preview',
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
    setTemplates([])
    setCollection([])
    setRegisteredUsers([])
    setCurrentId(null)
    setPurchaseTargetId(null)
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
          : { identifier: email, email, password }
      const response =
        mode === 'register'
          ? await registerUser(payload)
          : await loginUser(payload)

      clearAuthSession()
      saveAuthSession({ token: response.token }, { persistent: remember })
      setAppReady(false)
      setUser(response.user)
      setDesigns([])
      setTemplates([])
      setCollection([])
      setRegisteredUsers([])
      setCurrentId(null)
      setSessionToken(response.token)
      navigateTo(getDefaultPrivateRoute(response.user.accountType), {
        replace: true,
        designId: null,
      })
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
      const savedDesign = normalizeDesignSizes(await createDesignRequest(sessionToken, draft))

      setDesigns((previousDesigns) => [savedDesign, ...previousDesigns])
      navigateTo('editor-2d', { designId: savedDesign.id })
      notify(`"${savedDesign.name}" is ready for editing.`, 'success', 'Design created')
    } catch (error) {
      handleApiError(error, 'Design')
    } finally {
      setCreatingDesign(false)
    }
  }

  const handleCreateTemplate = async (payload) => {
    if (!sessionToken) return

    setCreatingTemplate(true)
    try {
      const draft = createNewDesign(payload)
      const savedTemplate = normalizeDesignSizes(
        await createTemplateRequest(sessionToken, {
          ...draft,
          price: payload.price,
        }),
      )

      setTemplates((previousTemplates) => [savedTemplate, ...previousTemplates])
      navigateTo('admin-template-editor', { designId: savedTemplate.id })
      notify(`"${savedTemplate.name}" is ready for publishing.`, 'success', 'Template created')
    } catch (error) {
      handleApiError(error, 'Template')
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleUpdateDesign = (nextDesign) => {
    setDesigns((previousDesigns) =>
      previousDesigns.map((design) => (design.id === nextDesign.id ? nextDesign : design)),
    )
  }

  const handleUpdateTemplate = (nextTemplate) => {
    setTemplates((previousTemplates) =>
      previousTemplates.map((template) =>
        template.id === nextTemplate.id ? nextTemplate : template,
      ),
    )
    setCollection((previousCollection) =>
      previousCollection.map((template) =>
        template.id === nextTemplate.id ? nextTemplate : template,
      ),
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

  const handleDeleteTemplate = async (templateId) => {
    const target = templates.find((template) => template.id === templateId)
    if (!target || !sessionToken) return
    if (!window.confirm(`Delete "${target.name}"? This will remove it from customer collections.`)) {
      return
    }

    try {
      await deleteTemplateRequest(sessionToken, templateId)
      setTemplates((previousTemplates) =>
        previousTemplates.filter((template) => template.id !== templateId),
      )
      setCollection((previousCollection) =>
        previousCollection.filter((template) => template.id !== templateId),
      )
      if (currentId === templateId) {
        setCurrentId(null)
        navigateTo('admin-templates', { replace: true, designId: null })
      }
      notify(`"${target.name}" was deleted.`, 'warning', 'Template removed')
    } catch (error) {
      handleApiError(error, 'Template')
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

  const handleSaveTemplate = async (templateId) => {
    if (!sessionToken) return

    const templateToSave = templates.find((template) => template.id === templateId)
    if (!templateToSave) return

    setSavingTemplateId(templateId)
    try {
      const savedTemplate = normalizeDesignSizes(
        await updateTemplateRequest(sessionToken, templateId, templateToSave),
      )

      setTemplates((previousTemplates) =>
        previousTemplates.map((template) =>
          template.id === templateId ? savedTemplate : template,
        ),
      )
      setCollection((previousCollection) =>
        previousCollection.map((template) =>
          template.id === templateId ? savedTemplate : template,
        ),
      )
      notify('Template changes have been saved.', 'success', 'Template saved')
    } catch (error) {
      handleApiError(error, 'Template')
    } finally {
      setSavingTemplateId(null)
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

  const handlePurchase = async () => {
    if (!sessionToken || !purchaseTarget) return

    setPurchasePending(true)
    try {
      const response = await purchaseTemplateRequest(sessionToken, purchaseTarget.id)
      const purchasedTemplate = normalizeDesignSizes(response.template)

      setCollection((previousCollection) => {
        const withoutPrevious = previousCollection.filter(
          (template) => template.id !== purchasedTemplate.id,
        )
        return [purchasedTemplate, ...withoutPrevious]
      })
      setPurchaseTargetId(null)
      navigateTo('collection', { replace: true })
      notify(
        `"${purchasedTemplate.name}" was added to your collection.`,
        'success',
        'Purchase complete',
      )
    } catch (error) {
      handleApiError(error, 'Purchase')
      throw error
    } finally {
      setPurchasePending(false)
    }
  }

  const openDesign = (id, nextRoute) => {
    navigateTo(nextRoute, { designId: id })
  }

  const handleOpenDesign = (id) => openDesign(id, 'editor')
  const handleViewDesign = (id) => openDesign(id, 'view-design')
  const handleView3d = (id) => openDesign(id, 'viewer-3d')
  const handleOpenTemplateEditor = (id) => openDesign(id, 'admin-template-editor')
  const handleViewAdminTemplate = (id) => openDesign(id, 'admin-template-view-2d')
  const handleViewTemplate2d = (id) => openDesign(id, 'template-view-2d')
  const handleViewCollection2d = (id) => openDesign(id, 'collection-view-2d')
  const handleViewCollection3d = (id) => openDesign(id, 'collection-view-3d')

  const navigate = (nextRoute, designId = undefined) => {
    navigateTo(nextRoute, { designId })
  }

  const activeNav = (() => {
    if (['editor', 'view-design', 'viewer-3d'].includes(route)) return 'designs'
    if (route === 'editor-2d') return 'new-design'
    if (route === 'template-view-2d') return 'templates'
    if (['collection-view-2d', 'collection-view-3d'].includes(route)) return 'collection'
    if (['admin-template-editor', 'admin-template-view-2d'].includes(route)) {
      return 'admin-templates'
    }
    return route
  })()

  const isEditorRoute = [
    'editor',
    'editor-2d',
    'view-design',
    'viewer-3d',
    'template-view-2d',
    'collection-view-2d',
    'collection-view-3d',
    'admin-template-editor',
    'admin-template-view-2d',
  ].includes(route)

  if (!appReady) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card card">
          <span className="tag">Backend Sync</span>
          <h2>Connecting to RoomCraft</h2>
          <p>Loading your account, saved designs, templates, and profile information.</p>
        </div>
      </div>
    )
  }

  if (route === 'landing') {
    return (
      <Landing
        onLogin={() => navigateTo('login')}
        onStart={() => navigateTo(sessionToken ? getDefaultPrivateRoute(user?.accountType) : 'login')}
      />
    )
  }

  if (route === 'login') {
    return <Login onSubmit={handleAuthSubmit} isSubmitting={authPending} />
  }

  return (
    <>
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
        {route === 'templates' && (
          <TemplatesMarketplace
            templates={templates}
            purchasedIds={purchasedTemplateIds}
            onView2d={handleViewTemplate2d}
            onPurchase={setPurchaseTargetId}
            onView3d={handleViewCollection3d}
            onOpenCollection={() => navigateTo('collection')}
          />
        )}
        {route === 'template-view-2d' && (
          <Editor
            user={user}
            design={currentTemplate}
            catalog={catalog}
            onUpdateDesign={handleUpdateTemplate}
            onSaveDesign={handleSaveTemplate}
            onExit={() => navigateTo('templates')}
            readOnly
            initialViewMode="2d"
            allowViewToggle={false}
            isSavingDesign={false}
          />
        )}
        {route === 'collection' && (
          <CustomerCollection
            templates={collection}
            onView2d={handleViewCollection2d}
            onView3d={handleViewCollection3d}
            onBrowseTemplates={() => navigateTo('templates')}
          />
        )}
        {route === 'collection-view-2d' && (
          <Editor
            user={user}
            design={currentTemplate}
            catalog={catalog}
            onUpdateDesign={handleUpdateTemplate}
            onSaveDesign={handleSaveTemplate}
            onExit={() => navigateTo('collection')}
            readOnly
            initialViewMode="2d"
            allowViewToggle={false}
            isSavingDesign={false}
          />
        )}
        {route === 'collection-view-3d' && (
          <Editor
            user={user}
            design={currentTemplate}
            catalog={catalog}
            onUpdateDesign={handleUpdateTemplate}
            onSaveDesign={handleSaveTemplate}
            onExit={() => navigateTo('collection')}
            readOnly
            initialViewMode="3d"
            allowViewToggle={false}
            isSavingDesign={false}
          />
        )}
        {route === 'admin-dashboard' && (
          <AdminDashboard
            user={user}
            templates={templates}
            registeredUsers={registeredUsers}
            onNewTemplate={() => navigateTo('admin-new-template')}
            onNavigate={navigate}
          />
        )}
        {route === 'admin-users' && <AdminUsers users={registeredUsers} />}
        {route === 'admin-templates' && (
          <AdminTemplates
            templates={templates}
            onOpen={handleOpenTemplateEditor}
            onView={handleViewAdminTemplate}
            onDelete={handleDeleteTemplate}
            onNewTemplate={() => navigateTo('admin-new-template')}
          />
        )}
        {route === 'admin-new-template' && (
          <NewDesign
            mode="template"
            onCreate={handleCreateTemplate}
            isSubmitting={creatingTemplate}
          />
        )}
        {route === 'admin-template-editor' && (
          <AdminTemplateEditor
            user={user}
            template={currentTemplate}
            catalog={catalog}
            onUpdateTemplate={handleUpdateTemplate}
            onSaveTemplate={handleSaveTemplate}
            onExit={() => navigateTo('admin-templates')}
            onLogout={handleLogout}
            isSaving={savingTemplateId === currentTemplate?.id}
          />
        )}
        {route === 'admin-template-view-2d' && (
          <Editor
            user={user}
            design={currentTemplate}
            catalog={catalog}
            onUpdateDesign={handleUpdateTemplate}
            onSaveDesign={handleSaveTemplate}
            onExit={() => navigateTo('admin-templates')}
            readOnly
            initialViewMode="2d"
            allowViewToggle={false}
            isSavingDesign={false}
          />
        )}
        {route === 'profile' && (
          <Profile
            user={user}
            designs={isAdmin ? templates : designs}
            onUpdateUser={handleUpdateUser}
            isSaving={profileSaving}
          />
        )}
        {route === 'help' && <Help />}
        {route === 'accessibility' && (
          <Accessibility settings={accessibility} onUpdate={setAccessibility} />
        )}
      </AppShell>
      {purchaseTarget && (
        <PurchaseModal
          template={purchaseTarget}
          isSubmitting={purchasePending}
          onClose={() => setPurchaseTargetId(null)}
          onConfirm={handlePurchase}
        />
      )}
    </>
  )
}
