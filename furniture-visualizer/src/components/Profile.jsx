import { useEffect, useMemo, useState } from 'react'
import { useNotifications } from '../member 4/NotificationProvider'

const formatMemberSince = (value) => {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function Profile({
  user,
  designs = [],
  onUpdateUser,
  isSaving = false,
}) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [role, setRole] = useState(user?.role || 'Designer')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { notify } = useNotifications()

  useEffect(() => {
    setName(user?.name || '')
    setEmail(user?.email || '')
    setRole(user?.role || 'Designer')
  }, [user])

  const storageUsed = useMemo(() => {
    const bytes = new Blob([JSON.stringify(designs)]).size
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }, [designs])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onUpdateUser({
        ...user,
        name: name || 'Designer',
        email,
        role,
        password: password || undefined,
      })
      setPassword('')
    } catch (submitError) {
      setError(submitError.message || 'Unable to update your profile.')
      return
    }

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
          <label className="field">
            <span>New Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </label>
          {error ? <div className="login-form-error">{error}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="card form-card profile-summary-card">
          <h3>Account Details</h3>
          <div className="detail-list">
            <div className="detail-row">
              <span>Member since</span>
              <strong>{formatMemberSince(user?.createdAt)}</strong>
            </div>
            <div className="detail-row">
              <span>Designs created</span>
              <strong>{designs.length}</strong>
            </div>
            <div className="detail-row">
              <span>Storage used</span>
              <strong>{storageUsed}</strong>
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
