import { useMemo, useState } from 'react'
import { formatDate } from '../member 4/format'

export default function TemplatesMarketplace({
  templates,
  purchasedIds,
  onView2d,
  onPurchase,
  onView3d,
  onOpenCollection,
}) {
  const [search, setSearch] = useState('')

  const purchasedSet = useMemo(() => new Set(purchasedIds), [purchasedIds])
  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return templates
    return templates.filter((template) => template.name.toLowerCase().includes(term))
  }, [search, templates])

  return (
    <div>
      <div className="dashboard-header">
        <h1>Templates</h1>
        <p>Preview ready-made layouts in 2D and purchase them for 3D access.</p>
      </div>

      <div className="search-bar">
        <input
          type="search"
          placeholder="Search templates..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="empty-state">
          <p>No templates published yet</p>
        </div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map((template) => {
            const purchased = purchasedSet.has(template.id)
            return (
              <article key={template.id} className="card template-card">
                <div className="template-card-head">
                  <span className="tag">{purchased ? 'Purchased' : 'Template'}</span>
                  <span className="template-price">${(template.price || 0).toFixed(0)}</span>
                </div>
                <h3>{template.name}</h3>
                <p className="template-copy">
                  {template.rooms?.length || 1} room plan with {template.items.length} placed items.
                </p>
                <div className="template-meta-list">
                  <div>
                    <span>Updated</span>
                    <strong>{formatDate(template.updatedAt)}</strong>
                  </div>
                  <div>
                    <span>2D Preview</span>
                    <strong>Available</strong>
                  </div>
                  <div>
                    <span>3D Access</span>
                    <strong>{purchased ? 'Unlocked' : 'Purchase required'}</strong>
                  </div>
                </div>
                <div className="template-actions">
                  <button className="btn btn-secondary" onClick={() => onView2d(template.id)}>
                    View in 2D
                  </button>
                  {purchased ? (
                    <>
                      <button className="btn btn-ghost" onClick={() => onView3d(template.id)}>
                        View in 3D
                      </button>
                      <button className="btn btn-ghost" onClick={onOpenCollection}>
                        Collection
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-primary" onClick={() => onPurchase(template.id)}>
                      Purchase
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
