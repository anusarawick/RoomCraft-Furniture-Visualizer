export default function Help() {
  const sections = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      title: 'Getting Started',
      tips: [
        'Create a new room with accurate measurements.',
        'Add furniture from the left catalogue.',
        'Use the toolbar to move, rotate, or delete items.',
      ],
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      title: '2D Layout Tips',
      tips: [
        'Drag items to reposition them on the grid.',
        'Use resize handles to match real dimensions.',
        'Toggle Snap to align furniture to a 0.1m grid.',
        'Undo/redo when testing different layouts.',
      ],
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      title: '3D Viewer Tips',
      tips: [
        'Drag empty space to orbit the room.',
        'Shift + drag an item to rotate it.',
        'Adjust lighting and shading for realism.',
      ],
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      ),
      title: 'Saving Designs',
      tips: [
        'Save changes regularly during consultations.',
        'Use My Designs to reopen or duplicate layouts.',
        'Use Export to save a 2D, 3D, or split snapshot for your report.',
      ],
    },
  ]

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Support</span>
        <h1>Help & Documentation</h1>
        <p>Guides and shortcuts for faster room planning.</p>
      </div>

      <div className="help-grid">
        {sections.map((section) => (
          <div className="card help-card" key={section.title}>
            <h3>
              <span style={{ color: 'var(--accent)', display: 'inline-flex' }}>{section.icon}</span>
              {section.title}
            </h3>
            <ul>
              {section.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card form-card" style={{ marginTop: 20, maxWidth: 600 }}>
        <h3>Need More Help?</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          If you need additional assistance, feel free to reach out to our support team
          or check the full documentation for advanced features and troubleshooting.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary btn-sm">Contact Support</button>
          <button className="btn btn-secondary btn-sm">View Full Docs</button>
        </div>
      </div>
    </div>
  )
}
