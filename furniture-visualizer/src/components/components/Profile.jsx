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
        <h1>Profile & Settings</h1>
        <p>Manage your designer account and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 800 }}>
        <form className="form-card card profile-form" onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.2rem' }}>
              {(user?.name || 'D').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>{user?.name || 'Designer'}</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{user?.email || 'designer@roomcraft.com'}</p>
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

        <div className="card form-card" style={{ maxWidth: '100%' }}>
          <h3>Account Details</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Member since</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>January 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Designs created</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>12</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Storage used</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>24 MB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Plan</span>
              <span className="tag">Free Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
