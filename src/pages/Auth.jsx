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
  const [signUpSuccess, setSignUpSuccess] = useState(false)
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
    } else if (isSignUp) {
      setSignUpSuccess(true)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DietitianOS</h1>
        {signUpSuccess ? (
          <div style={styles.successBox}>
            <p style={styles.successTitle}>✓ Account created successfully</p>
            <p style={styles.successText}>
              A confirmation email will be sent to <strong>{email}</strong>.
              Please check your inbox and confirm your address before signing in.
            </p>
            <button
              style={styles.button}
              type="button"
              onClick={() => {
                setSignUpSuccess(false)
                setIsSignUp(false)
                setPassword('')
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
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
    background: 'var(--bg)',
    padding: '1rem',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
  },
  title: {
    color: 'var(--text-heading)',
    fontSize: '1.6rem',
    marginBottom: '0.25rem',
    textAlign: 'center',
  },
  subtitle: {
    color: 'var(--text-secondary)',
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
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-heading)',
    fontSize: '1rem',
    outline: 'none',
  },
  button: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: 'var(--danger-text)',
    fontSize: '0.85rem',
    margin: 0,
  },
  toggle: {
    color: 'var(--info-text)',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '1.25rem',
    cursor: 'pointer',
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'center',
    textAlign: 'center',
  },
  successTitle: {
    color: 'var(--text-heading)',
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
  },
  successText: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    margin: 0,
    lineHeight: 1.5,
  },
}
