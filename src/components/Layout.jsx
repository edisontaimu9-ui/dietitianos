import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useState } from 'react'
import { Menu, LayoutDashboard, Users, Calendar, Sun, Moon } from 'lucide-react'

export default function Layout() {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
  ]

  return (
    <div style={styles.wrapper}>
      <header style={styles.topbar}>
        <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
          <Menu size={22} />
        </button>
        <span style={styles.brand}>DietitianOS</span>
        <div style={styles.headerActions}>
          <button
            style={styles.themeBtn}
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            title="Toggle light/dark mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button style={styles.signOutBtn} onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div style={styles.body}>
        <nav style={{ ...styles.sidebar, ...(menuOpen ? styles.sidebarOpen : {}) }}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
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
                <Icon size={18} style={{ marginRight: '0.6rem' }} />
                {item.label}
              </NavLink>
            )
          })}
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
    background: 'var(--bg)',
    color: 'var(--text-primary)',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1rem',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-heading)',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  brand: {
    color: 'var(--text-heading)',
    fontWeight: 700,
    fontSize: '1.05rem',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  themeBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '6px',
    padding: '0.35rem 0.5rem',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  signOutBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
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
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
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
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.95rem',
  },
  navLinkActive: {
    background: '#16a34a22',
    color: 'var(--success-text)',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '1rem',
    width: '100%',
  },
}
