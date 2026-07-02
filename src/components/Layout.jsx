import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Layout() {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/patients', label: 'Patients', icon: '🧑‍⚕️' },
    { to: '/appointments', label: 'Appointments', icon: '📅' },
  ]

  return (
    <div style={styles.wrapper}>
      <header style={styles.topbar}>
        <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <span style={styles.brand}>DietitianOS</span>
        <button style={styles.signOutBtn} onClick={signOut}>
          Sign out
        </button>
      </header>

      <div style={styles.body}>
        <nav style={{ ...styles.sidebar, ...(menuOpen ? styles.sidebarOpen : {}) }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              <span style={{ marginRight: '0.6rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1rem',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  brand: {
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.05rem',
  },
  signOutBtn: {
    background: 'none',
    border: '1px solid #334155',
    color: '#94a3b8',
    borderRadius: '6px',
    padding: '0.35rem 0.7rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  body: {
    display: 'flex',
    position: 'relative',
  },
  sidebar: {
    display: 'none',
    flexDirection: 'column',
    gap: '0.25rem',
    background: '#1e293b',
    borderRight: '1px solid #334155',
    padding: '0.75rem',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '220px',
    zIndex: 20,
    minHeight: '100%',
  },
  sidebarOpen: {
    display: 'flex',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    color: '#94a3b8',
    textDecoration: 'none',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
  },
  navLinkActive: {
    background: '#16a34a22',
    color: '#4ade80',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '1rem',
    width: '100%',
  },
}
