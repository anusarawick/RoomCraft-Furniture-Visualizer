import { useEffect, useState } from 'react'
import FurnitureIcon from './FurnitureIcon'

const toEditableNumber = (value) => String(value ?? '')

export default function Catalog({ catalog, onUpdateItem }) {
  const [editingItem, setEditingItem] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (!editingItem) return
    setDraft({
      name: editingItem.name,
      width: toEditableNumber(editingItem.width),
      depth: toEditableNumber(editingItem.depth),
      height: toEditableNumber(editingItem.height),
      color: editingItem.color,
    })
  }, [editingItem])

  const closeDialog = () => {
    setEditingItem(null)
    setDraft(null)
  }

  const handleSave = () => {
    if (!editingItem || !draft) return

    const width = Number(draft.width)
    const depth = Number(draft.depth)
    const height = Number(draft.height)
    if (!draft.name.trim()) return
    if (![width, depth, height].every((value) => Number.isFinite(value) && value > 0)) return

    onUpdateItem?.(editingItem.id, {
      name: draft.name.trim(),
      width,
      depth,
      height,
      color: draft.color,
    })
    closeDialog()
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Furniture Catalog</h1>
        <p>Browse available furniture pieces for your designs.</p>
      </div>
      <div className="catalog-grid">
        {catalog.filter((item) => !item.hidden).map((item) => (
          <button
            key={item.id}
            type="button"
            className="card catalog-card catalog-card-button"
            onClick={() => setEditingItem(item)}
          >
            <div className="catalog-banner">
              <FurnitureIcon name={item.icon} />
            </div>
            <div>
              <strong>{item.name}</strong>
            </div>
            <div className="catalog-info">
              <span>Width: {item.width}m</span>
              <span>Depth: {item.depth}m</span>
              <span>Height: {item.height}m</span>
              <div className="catalog-color">
                <span style={{ background: item.color }} />
                Default color
              </div>
            </div>
          </button>
        ))}
      </div>

      {editingItem && draft ? (
        <div className="export-dialog-backdrop" onClick={closeDialog}>
          <div
            className="export-dialog card catalog-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="export-dialog-header">
              <div>
                <h3 id="catalog-edit-title">Edit Catalog Item</h3>
                <p>{editingItem.name}</p>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeDialog}>
                Close
              </button>
            </div>

            <div className="catalog-edit-grid">
              <label className="field">
                Name
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                Width (m)
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={draft.width}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, width: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                Depth (m)
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={draft.depth}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, depth: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                Height (m)
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={draft.height}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, height: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                Default Color
                <input
                  type="color"
                  value={draft.color}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, color: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="export-dialog-actions">
              <button className="btn btn-ghost" type="button" onClick={closeDialog}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
