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
  const [error, setError] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
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
      })
    } catch (submitError) {
      setError(submitError.message || 'Unable to update your profile.')
      return
    }

    notify('Profile updated successfully.', 'success', 'Profile saved')
  }

  const closePasswordDialog = () => {
    if (isSaving) return
    setPasswordDialogOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setPasswordError('')
  }

  const handlePasswordChange = async () => {
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Complete all password fields.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    try {
      await onUpdateUser({
        ...user,
        currentPassword,
        password: newPassword,
      })
      closePasswordDialog()
    } catch (submitError) {
      setPasswordError(submitError.message || 'Unable to update your password.')
      return
    }

    notify('Password updated successfully.', 'success', 'Password changed')
  }

  return (
    <>
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
            <div className="profile-password-card">
              <strong>Password</strong>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </button>
            </div>
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
      {passwordDialogOpen && (
        <div className="export-dialog-backdrop" onClick={closePasswordDialog}>
          <div
            className="export-dialog card profile-password-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="export-dialog-header">
              <div>
                <h3 id="change-password-title">Change Password</h3>
                <p>Enter your current password and confirm the new one.</p>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closePasswordDialog}
                disabled={isSaving}
              >
                Close
              </button>
            </div>

            <div className="profile-dialog-grid">
              <label className="field">
                <span>Current Password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <label className="field">
                <span>New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
            </div>

            {passwordError ? <div className="login-form-error">{passwordError}</div> : null}

            <div className="export-dialog-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closePasswordDialog}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handlePasswordChange}
                disabled={isSaving}
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
