import { useMemo, useState } from 'react'
import { formatDate } from '../member 4/format'

export default function CustomerCollection({
  templates,
  onView2d,
  onView3d,
  onBrowseTemplates,
}) {
  const [search, setSearch] = useState('')

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return templates
    return templates.filter((template) => template.name.toLowerCase().includes(term))
  }, [search, templates])

  return (
    <div>
      <div className="dashboard-header">
        <h1>Customer Collection</h1>
        <p>{templates.length} purchased templates with 3D access</p>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search purchased templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <p>No purchased templates yet</p>
          <p>Buy a template to unlock 3D viewing here.</p>
          <button className="btn btn-primary" onClick={onBrowseTemplates}>
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map((template) => (
            <article key={template.id} className="card template-card">
              <div className="template-card-head">
                <span className="tag">Unlocked</span>
                <span className="template-price">${(template.price || 0).toFixed(0)}</span>
              </div>
              <h3>{template.name}</h3>
              <p className="template-copy">
                Purchased template ready for both 2D preview and 3D walkthrough.
              </p>
              <div className="template-meta-list">
                <div>
                  <span>Updated</span>
                  <strong>{formatDate(template.updatedAt)}</strong>
                </div>
                <div>
                  <span>Rooms</span>
                  <strong>{template.rooms?.length || 1}</strong>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{template.items.length}</strong>
                </div>
              </div>
              <div className="template-actions">
                <button className="btn btn-secondary" onClick={() => onView2d(template.id)}>
                  View in 2D
                </button>
                <button className="btn btn-primary" onClick={() => onView3d(template.id)}>
                  View in 3D
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
