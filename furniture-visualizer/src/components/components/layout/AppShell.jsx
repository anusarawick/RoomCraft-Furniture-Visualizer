import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({
  active,
  user,
  onNavigate,
  onLogout,
  breadcrumbs,
  contentClassName = '',
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar active={active} user={user} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="app-main">
        <TopBar breadcrumbs={breadcrumbs} />
        <div className={`page-content ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )
}
