import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        await register(username, email, password)
      } else {
        await login(username, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'שגיאה בשליחת האימייל')
      }

      setSuccess(data.message)
      setForgotEmail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Forgot password form
  if (showForgotPassword) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h1>שכחתי סיסמה</h1>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="forgot-email">כתובת אימייל</label>
              <input
                type="email"
                id="forgot-email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                placeholder="הזן את האימייל שלך"
                autoComplete="email"
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'שולח...' : 'שלח סיסמה חדשה'}
            </button>
          </form>

          <div className="login-switch">
            <p>
              נזכרת בסיסמה?{' '}
              <button type="button" onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}>
                חזור להתחברות
              </button>
            </p>
          </div>

          <Link to="/" className="back-link">חזרה למתכונים</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{isRegister ? 'יצירת חשבון' : 'התחברות'}</h1>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">שם משתמש</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">אימייל</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'אנא המתן...' : (isRegister ? 'הרשמה' : 'התחבר')}
          </button>
        </form>

        {!isRegister && (
          <div className="forgot-password-link">
            <button type="button" onClick={() => setShowForgotPassword(true)}>
              שכחתי סיסמה
            </button>
          </div>
        )}

        <div className="login-switch">
          {isRegister ? (
            <p>
              כבר יש לך חשבון?{' '}
              <button type="button" onClick={() => setIsRegister(false)}>
                התחבר
              </button>
            </p>
          ) : (
            <p>
              אין לך חשבון?{' '}
              <button type="button" onClick={() => setIsRegister(true)}>
                הרשם
              </button>
            </p>
          )}
        </div>

        <Link to="/" className="back-link">חזרה למתכונים</Link>
      </div>
    </div>
  )
}

export default Login
