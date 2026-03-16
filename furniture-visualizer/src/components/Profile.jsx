import { useState } from 'react'
import { useNotifications } from '../member 4/NotificationProvider'

export default function Profile({ user, onUpdateUser }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [role, setRole] = useState(user?.role || 'Designer')
  const { notify } = useNotifications()

  const handleSubmit = (event) => {
    event.preventDefault()
    onUpdateUser({ ...user, name: name || 'Designer', email, role })
    notify('Profile updated successfully.', 'success', 'Profile saved')
  }

  return (
    <div>
      <div className="dashboard-header">
        <span className="tag" style={{ justifySelf: 'start' }}>Account</span>
        <h1>Profile Settings</h1>
        <p>Manage your designer account and preferences.</p>
      </div>

      <div className="settings-page-grid">
        <form className="form-card card profile-form" onSubmit={handleSubmit}>
          <div className="profile-hero">
            <div className="avatar profile-avatar">
              {(user?.name || 'D').slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-hero-copy">
              <strong>{user?.name || 'Designer'}</strong>
              <p>{user?.email || 'designer@roomcraft.com'}</p>
            </div>
          </div>
          <label className="field">
            <span>Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sarah Mitchell"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="sarah@roomcraft.com"
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="Designer">Designer</option>
              <option value="Senior Designer">Senior Designer</option>
              <option value="Manager">Manager</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit">
            Save Changes
          </button>
        </form>

        <div className="card form-card profile-summary-card">
          <h3>Account Details</h3>
          <div className="detail-list">
            <div className="detail-row">
              <span>Member since</span>
              <strong>January 2026</strong>
            </div>
            <div className="detail-row">
              <span>Designs created</span>
              <strong>12</strong>
            </div>
            <div className="detail-row">
              <span>Storage used</span>
              <strong>24 MB</strong>
            </div>
            <div className="detail-row no-border">
              <span>Plan</span>
              <span className="tag">Free Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
