import { useMemo, useState } from 'react'
import { formatDate } from '../member 4/format'

export default function AdminTemplates({
  templates,
  onOpen,
  onView,
  onDelete,
  onNewTemplate,
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
        <h1>Template Library</h1>
        <p>{templates.length} templates available for customers</p>
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
          <p>No templates yet</p>
          <button className="btn btn-primary" onClick={onNewTemplate}>
            Create your first template
          </button>
        </div>
      ) : (
        <div className="design-list">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card design-row">
              <div>
                <strong>{template.name}</strong>
                <div className="design-meta">
                  ${(template.price || 0).toFixed(0)} · {template.items.length} items
                </div>
                <div className="design-meta">Updated {formatDate(template.updatedAt)}</div>
              </div>
              <div className="tool-group" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => onOpen(template.id)}>
                  Edit
                </button>
                <button className="btn btn-ghost" onClick={() => onView(template.id)}>
                  View in 2D
                </button>
                <button className="btn btn-ghost" onClick={() => onDelete(template.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
