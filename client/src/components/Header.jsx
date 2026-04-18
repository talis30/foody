import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo-section">
          <div className="logo-placeholder">
            {/* Logo will be added later */}
          </div>
          <h1 className="site-name">Foody</h1>
        </Link>

        <nav className="main-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>

          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">{user.username}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="nav-link login-link">Login</Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
