import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = isSignUp
      ? await signUp(email, password, fullName)
      : await signIn(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DietitianOS</h1>
        <p style={styles.subtitle}>
          {isSignUp ? 'Create your practice account' : 'Sign in to your practice'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <input
              style={styles.input}
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p style={styles.toggle} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    padding: '1rem',
  },
  card: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  title: {
    color: '#fff',
    fontSize: '1.6rem',
    marginBottom: '0.25rem',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#f87171',
    fontSize: '0.85rem',
    margin: 0,
  },
  toggle: {
    color: '#60a5fa',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '1.25rem',
    cursor: 'pointer',
  },
}
