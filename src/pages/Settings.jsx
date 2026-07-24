import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, LogOut } from 'lucide-react'

export default function Settings() {
  const { user, signOut, updatePassword, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileMsg('')
    setProfileLoading(true)
    const { error } = await updateProfile(fullName)
    setProfileLoading(false)
    setProfileMsg(error ? error.message : 'Profile updated')
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    const { error } = await updatePassword(newPassword)
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordMsg('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Account</h2>
        <p style={styles.label}>Email</p>
        <p style={styles.staticValue}>{user?.email}</p>

        <form onSubmit={handleProfileSave} style={styles.form}>
          <label style={styles.label} htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            style={styles.input}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
          />
          {profileMsg && <p style={styles.hint}>{profileMsg}</p>}
          <button style={styles.button} type="submit" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Change password</h2>
        <form onSubmit={handlePasswordSave} style={styles.form}>
          <input
            style={styles.input}
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
          />
          {passwordError && <p style={styles.error}>{passwordError}</p>}
          {passwordMsg && <p style={styles.hint}>{passwordMsg}</p>}
          <button style={styles.button} type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Appearance</h2>
        <button style={styles.rowButton} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span style={{ marginLeft: '0.6rem' }}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </span>
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Session</h2>
        <button style={{ ...styles.rowButton, ...styles.signOutRow }} onClick={signOut}>
          <LogOut size={18} />
          <span style={{ marginLeft: '0.6rem' }}>Sign out</span>
        </button>
      </section>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  title: {
    color: 'var(--text-heading)',
    fontSize: '1.4rem',
    marginBottom: '0.25rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  sectionTitle: {
    color: 'var(--text-heading)',
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
  },
  staticValue: {
    color: 'var(--text-heading)',
    fontSize: '0.95rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  input: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-heading)',
    fontSize: '0.95rem',
    outline: 'none',
  },
  button: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.25rem',
    alignSelf: 'flex-start',
    paddingLeft: '1.25rem',
    paddingRight: '1.25rem',
  },
  rowButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  signOutRow: {
    color: 'var(--danger-text)',
  },
  error: {
    color: 'var(--danger-text)',
    fontSize: '0.85rem',
    margin: 0,
  },
  hint: {
    color: 'var(--success-text)',
    fontSize: '0.85rem',
    margin: 0,
  },
}
