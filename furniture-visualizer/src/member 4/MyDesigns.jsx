import { useMemo, useState } from 'react'
import { formatDate } from './format'

export default function MyDesigns({
  designs,
  onOpen,
  onView,
  onView3d,
  onDelete,
  onNewDesign,
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return designs.filter((design) => design.name.toLowerCase().includes(term))
  }, [designs, search])

  return (
    <div>
      <div className="dashboard-header">
        <h1>My Designs</h1>
        <p>{designs.length} designs saved</p>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search designs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No designs yet</p>
          <button className="btn btn-primary" onClick={onNewDesign}>
            Create your first design
          </button>
        </div>
      ) : (
        <div className="design-list">
          {filtered.map((design) => {
            const roomCount = design.rooms?.length || 0
            const primaryRoom = design.rooms?.[0] || design.room
            const roomLabel =
              roomCount > 1
                ? `${roomCount} rooms`
                : `${primaryRoom?.width ?? 0}m x ${primaryRoom?.depth ?? 0}m`
            return (
              <div key={design.id} className="card design-row">
                <div>
                  <strong>{design.name}</strong>
                  <div className="design-meta">
                    {roomLabel} · {design.items.length} items
                  </div>
                  <div className="design-meta">Updated {formatDate(design.updatedAt)}</div>
                </div>
                <div className="tool-group" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => onOpen?.(design.id)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" onClick={() => onView?.(design.id)}>
                    View
                  </button>
                  <button className="btn btn-ghost" onClick={() => onView3d?.(design.id)}>
                    3D View
                  </button>
                  <button className="btn btn-ghost" onClick={() => onDelete(design.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

