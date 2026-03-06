import { useNotifications } from '../member 4/NotificationProvider'

export default function Accessibility({ settings, onUpdate }) {
  const { notify } = useNotifications()

  const handleToggle = (field) => (event) => {
    onUpdate({ ...settings, [field]: event.target.checked })
    notify('Accessibility preferences updated.', 'success', 'Settings saved')
  }

  const options = [
    {
      key: 'highContrast',
      title: 'High-contrast mode',
      desc: 'Increases contrast for better visibility',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: 'largeText',
      title: 'Larger text',
      desc: 'Increases base font size across the app',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      key: 'reducedMotion',
      title: 'Reduce motion',
      desc: 'Disables animations and transitions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9.5 4a3.5 3.5 0 1 0 5 5" />
          <path d="M17.94 17.94A10 10 0 0 1 2 12" />
          <path d="M12 2a10 10 0 0 1 9.95 9" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Settings</span>
        <h1>Accessibility Settings</h1>
        <p>Customize contrast, text size, and motion preferences for a comfortable experience.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>
        <div className="card form-card accessibility-card" style={{ maxWidth: '100%' }}>
          <h3>Display Preferences</h3>
          {options.map((opt) => (
            <label key={opt.key} className="checkbox-row">
              <input
                type="checkbox"
                checked={settings[opt.key]}
                onChange={handleToggle(opt.key)}
              />
              <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{opt.icon}</div>
              <div>
                <strong>{opt.title}</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                  {opt.desc}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="card form-card" style={{ maxWidth: '100%' }}>
          <h3>About Accessibility</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.7 }}>
            RoomCraft is committed to providing an inclusive experience for all users.
            These settings allow you to customize the interface to suit your needs.
          </p>
          <div style={{ display: 'grid', gap: 12, marginTop: 4 }}>
            <div style={{ padding: '12px 14px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Keyboard Navigation</strong>
              <span style={{ color: 'var(--muted)' }}>Use Tab and Enter keys to navigate through all interactive elements.</span>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Screen Reader Support</strong>
              <span style={{ color: 'var(--muted)' }}>All elements include proper ARIA labels for assistive technologies.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
