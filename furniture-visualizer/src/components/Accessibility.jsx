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
    },
    {
      key: 'largeText',
      title: 'Larger text',
      desc: 'Increases base font size across the app',
    },
    {
      key: 'reducedMotion',
      title: 'Reduce motion',
      desc: 'Disables animations and transitions',
    },
  ]

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Settings</span>
        <h1>Accessibility Settings</h1>
        <p>Customize contrast, text size, and motion preferences for a comfortable experience.</p>
      </div>

      <div className="settings-page-grid">
        <div className="card form-card accessibility-card">
          <h3>Display Preferences</h3>
          {options.map((opt) => (
            <label key={opt.key} className="checkbox-row preference-card">
              <input
                type="checkbox"
                checked={settings[opt.key]}
                onChange={handleToggle(opt.key)}
              />
              <div className="preference-copy">
                <strong>{opt.title}</strong>
                <p>{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="card form-card accessibility-info-card">
          <h3>About Accessibility</h3>
          <p className="settings-copy">
            RoomCraft is committed to providing an inclusive experience for all users.
            These settings allow you to customize the interface to suit your needs.
          </p>
          <div className="settings-note-list">
            <div className="settings-note">
              <strong>Keyboard Navigation</strong>
              <span>Use Tab and Enter keys to navigate through all interactive elements.</span>
            </div>
            <div className="settings-note">
              <strong>Screen Reader Support</strong>
              <span>All elements include proper ARIA labels for assistive technologies.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
