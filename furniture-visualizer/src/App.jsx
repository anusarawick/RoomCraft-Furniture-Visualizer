import { useEffect, useMemo, useState } from 'react'
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
import { createNewDesign, createSampleDesign } from './member 1/designs'
import { loadFromStorage, saveToStorage } from './member 1/storage'
import { normalizeDesignSizes } from './member 1/normalizeDesign'

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

const mergeCatalog = (storedCatalog) => {
  if (!Array.isArray(storedCatalog) || !storedCatalog.length) {
    return FURNITURE_CATALOG
  }

  const storedMap = new Map(storedCatalog.map((item) => [item.id, item]))
  return FURNITURE_CATALOG.map((item) => ({ ...item, ...(storedMap.get(item.id) || {}) }))
}

export default function App() {
  const [user, setUser] = useState(() => loadFromStorage(STORAGE_KEYS.user, null))
  const [designs, setDesigns] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEYS.designs, null)
    if (stored?.length) return stored.map((design) => normalizeDesignSizes(design))
    return [createSampleDesign()]
  })
  const [route, setRoute] = useState(() =>
    loadFromStorage(STORAGE_KEYS.user, null) ? 'dashboard' : 'landing',
  )
  const [currentId, setCurrentId] = useState(null)
  const [accessibility, setAccessibility] = useState(() =>
    loadFromStorage(STORAGE_KEYS.accessibility, DEFAULT_ACCESSIBILITY),
  )
  const [catalog, setCatalog] = useState(() =>
    mergeCatalog(loadFromStorage(STORAGE_KEYS.catalog, FURNITURE_CATALOG)),
  )
  const { notify } = useNotifications()

  useEffect(() => {
    if (!currentId && designs.length) {
      setCurrentId(designs[0].id)
    }
  }, [currentId, designs])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.designs, designs)
  }, [designs])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.catalog, catalog)
  }, [catalog])

  useEffect(() => {
    if (user) {
      saveToStorage(STORAGE_KEYS.user, user)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.user)
    }
  }, [user])

  useEffect(() => {
    if (!user && !['landing', 'login'].includes(route)) {
      setRoute('login')
    }
  }, [user, route])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.accessibility, accessibility)
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('a11y-contrast', accessibility.highContrast)
      root.classList.toggle('a11y-large-text', accessibility.largeText)
      root.classList.toggle('a11y-reduced-motion', accessibility.reducedMotion)
    }
  }, [accessibility])

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

  const handleLogin = (profile) => {
    setUser(profile)
    setRoute('dashboard')
    notify(`Welcome back, ${profile.name}`, 'success', 'Signed In')
  }

  const handleLogout = () => {
    setUser(null)
    setRoute('landing')
  }

  const handleCreateDesign = (payload) => {
    const design = createNewDesign(payload)
    setDesigns((prev) => [design, ...prev])
    setCurrentId(design.id)
    setRoute('editor-2d')
    notify(`"${design.name}" is ready for editing.`, 'success', 'Design created')
  }

  const handleUpdateDesign = (nextDesign) => {
    setDesigns((prev) =>
      prev.map((design) => (design.id === nextDesign.id ? nextDesign : design)),
    )
  }

  const handleUpdateCatalogItem = (itemId, changes) => {
    setCatalog((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...changes } : item)),
    )
    setDesigns((prev) =>
      prev.map((design) => ({
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

  const handleDeleteDesign = (designId) => {
    const target = designs.find((design) => design.id === designId)
    if (!target) return
    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return
    setDesigns((prev) => prev.filter((design) => design.id !== designId))
    if (currentId === designId) {
      setCurrentId(null)
      setRoute('designs')
    }
    notify(`"${target.name}" was deleted.`, 'warning', 'Design removed')
  }

  const handleSaveDesign = (designId) => {
    setDesigns((prev) =>
      prev.map((design) =>
        design.id === designId
          ? { ...design, updatedAt: new Date().toISOString() }
          : design,
      ),
    )
    notify('Your changes have been saved.', 'success', 'Design saved')
  }

  const openDesign = (id, nextRoute) => {
    setCurrentId(id)
    setRoute(nextRoute)
  }

  const handleOpenDesign = (id) => openDesign(id, 'editor')
  const handleViewDesign = (id) => openDesign(id, 'view-design')
  const handleView3d = (id) => openDesign(id, 'viewer-3d')

  const navigate = (nextRoute) => {
    if (!ROUTES.includes(nextRoute)) return
    setRoute(nextRoute)
  }

  const activeNav = ['editor', 'view-design', 'viewer-3d'].includes(route)
    ? 'designs'
    : route === 'editor-2d'
      ? 'new-design'
      : route

  const isEditorRoute = ['editor', 'editor-2d', 'view-design', 'viewer-3d'].includes(route)

  if (route === 'landing') {
    return (
      <Landing
        onLogin={() => setRoute('login')}
        onStart={() => (user ? setRoute('dashboard') : setRoute('login'))}
      />
    )
  }

  if (route === 'login') {
    return <Login onSubmit={handleLogin} />
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
          onNewDesign={() => setRoute('new-design')}
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
          onNewDesign={() => setRoute('new-design')}
        />
      )}
      {route === 'new-design' && <NewDesign onCreate={handleCreateDesign} />}
      {route === 'editor' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => setRoute('designs')}
          onLogout={handleLogout}
        />
      )}
      {route === 'editor-2d' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => setRoute('dashboard')}
          onLogout={handleLogout}
          initialViewMode="2d"
          allowViewToggle
        />
      )}
      {route === 'view-design' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => setRoute('designs')}
          readOnly
          initialViewMode="2d"
          allowViewToggle
        />
      )}
      {route === 'viewer-3d' && (
        <Editor
          user={user}
          design={currentDesign}
          catalog={catalog}
          onUpdateDesign={handleUpdateDesign}
          onSaveDesign={handleSaveDesign}
          onExit={() => setRoute('designs')}
          readOnly
          initialViewMode="3d"
          allowViewToggle={false}
        />
      )}
      {route === 'profile' && <Profile user={user} onUpdateUser={setUser} />}
      {route === 'help' && <Help />}
      {route === 'accessibility' && (
        <Accessibility settings={accessibility} onUpdate={setAccessibility} />
      )}
    </AppShell>
  )
}

