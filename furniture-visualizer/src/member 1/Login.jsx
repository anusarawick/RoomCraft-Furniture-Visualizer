import { useState } from 'react'

export default function Login({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const displayName = email.split('@')[0] || 'Designer'
    onSubmit({ name: displayName, email })
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
          <h1>Welcome Back</h1>
          <p className="login-subtitle">Sign in to your designer account to continue</p>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="login-forgot">Forgot password?</button>
            </div>
            <button className="btn btn-primary btn-lg login-submit" type="submit">
              Sign In
            </button>
          </form>
          <div className="login-divider">
            <span>or continue with</span>
          </div>
          <div className="login-social">
            <button type="button" className="btn btn-ghost login-social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>
            <button type="button" className="btn btn-ghost login-social-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
              GitHub
            </button>
          </div>
          <p className="login-signup-prompt">
            Don't have an account? <button type="button" onClick={() => onSubmit({ name: 'Designer', email: 'demo@roomcraft.com' })}>Create one</button>
          </p>
          <div className="demo-box">
            ℹ️ This is a demo — use any email and password to sign in
          </div>
        </div>
      </div>
    </div>
  )
}
