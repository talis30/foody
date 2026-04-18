import { useState, useEffect } from 'react'
import './Footer.css'

function Footer() {
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date) => {
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p className="datetime">{formatDateTime(dateTime)}</p>
      </div>
    </footer>
  )
}

export default Footer
