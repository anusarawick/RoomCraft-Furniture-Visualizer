import { formatDate } from './format'

export default function Dashboard({
  user,
  designs,
  onNewDesign,
  onOpen,
  onNavigate,
}) {
  const totalDesigns = designs.length
  const furniturePlaced = designs.reduce((sum, design) => sum + design.items.length, 0)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const createdThisWeek = designs.filter(
    (design) => new Date(design.updatedAt).getTime() >= weekAgo,
  ).length

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Dashboard</span>
        <h1>Welcome back, {user?.name || 'Designer'}</h1>
        <p>Manage your room designs and create stunning visualizations.</p>
      </div>

      <div className="dashboard-actions">
        <button className="card action-card" onClick={onNewDesign}>
          <div className="action-icon">＋</div>
          <div>
            <strong>New Design</strong>
            <p>Create a new room layout</p>
          </div>
        </button>
        <button
          className="card action-card"
          onClick={() => onNavigate('designs')}
        >
          <div className="action-icon">▦</div>
          <div>
            <strong>My Designs</strong>
            <p>{totalDesigns} saved designs</p>
          </div>
        </button>
        <button
          className="card action-card"
          onClick={() => onNavigate('catalog')}
        >
          <div className="action-icon">◆</div>
          <div>
            <strong>Furniture Catalog</strong>
            <p>Browse available pieces</p>
          </div>
        </button>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <h4>Total Designs</h4>
          <div className="stat-value">{totalDesigns}</div>
        </div>
        <div className="card stat-card">
          <h4>Updated This Week</h4>
          <div className="stat-value">{createdThisWeek}</div>
        </div>
        <div className="card stat-card">
          <h4>Furniture Placed</h4>
          <div className="stat-value">{furniturePlaced}</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Recent Designs</h2>
      </div>
      {designs.length === 0 ? (
        <div className="empty-state">
          <p>No designs yet</p>
          <p>Create your first room design to get started.</p>
          <button className="btn btn-primary" onClick={onNewDesign}>
            New Design
          </button>
        </div>
      ) : (
        <div className="design-list">
          {designs.slice(0, 4).map((design) => {
            const roomCount = design.rooms?.length || 0
            const primaryRoom = design.rooms?.[0] || design.room
            const roomLabel =
              roomCount > 1
                ? `${roomCount} rooms`
                : `${primaryRoom?.width ?? 0}m × ${primaryRoom?.depth ?? 0}m`
            return (
              <div key={design.id} className="card design-row">
                <div>
                  <strong>{design.name}</strong>
                  <div className="design-meta">
                    {roomLabel} · {design.items.length} items
                  </div>
                  <div className="design-meta">Updated {formatDate(design.updatedAt)}</div>
                </div>
                <button className="btn btn-secondary" onClick={() => onOpen(design.id)}>
                  Open
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
