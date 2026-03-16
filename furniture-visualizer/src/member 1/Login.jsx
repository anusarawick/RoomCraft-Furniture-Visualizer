import { useState } from 'react'

export default function Login({ onSubmit, isSubmitting = false }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      await onSubmit({
        mode,
        name: name.trim(),
        email: email.trim(),
        password,
        remember,
      })
    } catch (submitError) {
      setError(submitError.message || 'Unable to complete your request.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-image-side">
        <img
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&h=1100&fit=crop"
          alt="Elegant modern interior"
        />
        <div className="login-image-overlay">
          <div className="login-image-text">
            <h2>Design Spaces That Inspire</h2>
            <p>Premium furniture visualization for modern living.</p>
          </div>
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-brand">
            <span className="login-brand-icon">RC</span>
            <span className="login-brand-name">RoomCraft</span>
          </div>
          <div className="login-mode-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              Register
            </button>
          </div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Sign in to continue working on your saved room designs.'
              : 'Create an account to save designs, manage your profile, and sync your work.'}
          </p>
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Sarah Mitchell"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </label>
            {mode === 'register' && (
              <label className="field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
            )}
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="login-form-note">MongoDB-backed account</span>
            </div>
            {error ? <div className="login-form-error">{error}</div> : null}
            <button
              className="btn btn-primary btn-lg login-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === 'login'
                  ? 'Signing In...'
                  : 'Creating Account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
          <p className="login-signup-prompt">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in instead'}
            </button>
          </p>
          <div className="demo-box">
            Your account and designs are stored through the Express API and MongoDB.
          </div>
        </div>
      </div>
    </div>
  )
}
