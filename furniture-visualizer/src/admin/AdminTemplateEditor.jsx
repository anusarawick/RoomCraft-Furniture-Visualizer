import Editor from '../components/editor/Editor'

const normalizePrice = (value) => {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue)) return 0
  return Math.max(0, nextValue)
}

export default function AdminTemplateEditor({
  user,
  template,
  catalog,
  onUpdateTemplate,
  onSaveTemplate,
  onExit,
  onLogout,
  isSaving = false,
}) {
  if (!template) {
    return (
      <Editor
        user={user}
        design={template}
        catalog={catalog}
        onUpdateDesign={onUpdateTemplate}
        onSaveDesign={onSaveTemplate}
        onExit={onExit}
        onLogout={onLogout}
        initialViewMode="2d"
        allowViewToggle
        isSavingDesign={isSaving}
      />
    )
  }

  return (
    <div className="admin-template-editor-layout">
      <div className="card admin-template-settings">
        <div className="admin-template-settings-copy">
          <span className="tag">Template Pricing</span>
          <h2>{template.name}</h2>
          <p>Adjust the customer purchase price whenever you need to update this template.</p>
        </div>
        <div className="admin-template-settings-form">
          <label className="field">
            <span>Template Price (USD)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={template.price ?? 0}
              onChange={(event) =>
                onUpdateTemplate({
                  ...template,
                  price: normalizePrice(event.target.value),
                })}
            />
          </label>
          <div className="template-price-preview">
            <span>Current Price</span>
            <strong>${normalizePrice(template.price).toFixed(0)}</strong>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => onSaveTemplate(template.id)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Price'}
          </button>
        </div>
      </div>

      <div className="admin-template-editor-shell">
        <Editor
          user={user}
          design={template}
          catalog={catalog}
          onUpdateDesign={onUpdateTemplate}
          onSaveDesign={onSaveTemplate}
          onExit={onExit}
          onLogout={onLogout}
          initialViewMode="2d"
          allowViewToggle
          isSavingDesign={isSaving}
        />
      </div>
    </div>
  )
}
