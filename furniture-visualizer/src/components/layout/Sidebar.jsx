const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    id: 'new-design',
    label: 'New Design',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    id: 'designs',
    label: 'My Designs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <path d="M4 7h8l2 2h6v8a2 2 0 0 1-2 2H4z" />
      </svg>
    ),
  },
  {
    id: 'catalog',
    label: 'Furniture Catalog',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 10h10" />
      </svg>
    ),
  },
]

const SUPPORT_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c2-4 6-6 8-6s6 2 8 6" />
      </svg>
    ),
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <circle cx="12" cy="4" r="2" />
        <path d="M4 8h16" />
        <path d="M9 8l3 5 3-5" />
        <path d="M6 20l4-7" />
        <path d="M18 20l-4-7" />
      </svg>
    ),
  },
  {
    id: 'help',
    label: 'Help',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.9.3-1.4 1-1.4 2.2" />
        <circle cx="12" cy="17" r="0.8" />
      </svg>
    ),
  },
]

export default function Sidebar({ active, onNavigate, onLogout, user }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">R</div>
        <div>
          <div className="sidebar-title">RoomCraft</div>
          <div className="sidebar-subtitle">Furniture Visualizer</div>
        </div>
      </div>

      <div className="sidebar-section">Navigation</div>
      <div className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-section">Support</div>
      <div className="sidebar-nav">
        {SUPPORT_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">
          {(user?.name || 'S').slice(0, 1).toUpperCase()}
        </div>
        <div className="sidebar-user">
          <div>{user?.name || 'Designer'}</div>
          <div>{user?.email || 'designer@roomcraft.com'}</div>
        </div>
        <button type="button" className="logout-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}
