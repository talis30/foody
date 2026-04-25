import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Header.css'

function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const closeMenu = () => {
    setMenuOpen(false)
  }

  const handleLogoClick = (e) => {
    closeMenu()
    // If already on home page, force reload to reset search
    if (location.pathname === '/') {
      e.preventDefault()
      window.location.href = '/'
    }
  }

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo-section" onClick={handleLogoClick}>
          <div className="logo-placeholder">
            {/* Logo will be added later */}
          </div>
          <h1 className="site-name">Foody</h1>
        </Link>

        <div className="header-right">
          {/* User icon */}
          <div className="user-icon-section">
            {isAuthenticated ? (
              <div className="user-logged-in">
                <span className="user-icon logged-in" title={user.username}>👤</span>
                <span className="user-name-desktop">{user.username}</span>
              </div>
            ) : (
              <Link to="/login" className="user-icon not-logged-in" title="התחבר" onClick={closeMenu}>
                👤
              </Link>
            )}
          </div>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="תפריט"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {/* Mobile user section */}
          {isAuthenticated && (
            <div className="mobile-user-section">
              <span className="user-icon logged-in">👤</span>
              <span className="user-name-mobile">{user.username}</span>
            </div>
          )}

          <Link to="/" className="nav-link" onClick={closeMenu}>בית</Link>
          <Link to="/about" className="nav-link" onClick={closeMenu}>אודות</Link>

          {isAuthenticated ? (
            <button onClick={handleLogout} className="logout-btn">התנתק</button>
          ) : (
            <Link to="/login" className="nav-link login-link" onClick={closeMenu}>התחבר</Link>
          )}
        </nav>

        {menuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      </div>
    </header>
  )
}

export default Header
