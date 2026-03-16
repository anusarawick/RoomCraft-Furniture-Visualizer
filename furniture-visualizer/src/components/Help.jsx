export default function Help() {
  const sections = [
    {
      title: 'Getting Started',
      tips: [
        'Create a new room with accurate measurements.',
        'Add furniture from the left catalogue.',
        'Use the toolbar to move, rotate, or delete items.',
      ],
    },
    {
      title: '2D Layout Tips',
      tips: [
        'Drag items to reposition them in the plan.',
        'Use resize handles to match real dimensions.',
        'Use undo and redo while testing layout changes.',
        'Select any item to update its dimensions and colour.',
      ],
    },
    {
      title: '3D Viewer Tips',
      tips: [
        'Drag empty space to orbit the room.',
        'Shift + drag an item to rotate it.',
        'Use the split view when comparing 2D and 3D together.',
      ],
    },
    {
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
        <h1>Help Documentation</h1>
        <p>Guides and shortcuts for faster room planning.</p>
      </div>

      <div className="help-grid">
        {sections.map((section) => (
          <div className="card help-card" key={section.title}>
            <h3>{section.title}</h3>
            <ul className="help-list">
              {section.tips.map((tip, i) => (
                <li className="help-list-item" key={i}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card support-panel">
        <h3>Need More Help?</h3>
        <p className="support-panel-copy">
          If you need additional assistance, feel free to reach out to our support team
          or check the full documentation for advanced features and troubleshooting.
        </p>
        <div className="support-panel-actions">
          <button className="btn btn-primary btn-sm">Contact Support</button>
          <button className="btn btn-secondary btn-sm">View Full Docs</button>
        </div>
      </div>
    </div>
  )
}
