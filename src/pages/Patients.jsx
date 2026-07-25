import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { collData } from '../lib/firestoreHelpers'
import { useAuth } from '../context/AuthContext'

export default function Patients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadPatients()
  }, [user])

  async function loadPatients() {
    setLoading(true)
    try {
      const q = query(
        collection(db, 'patients'),
        where('dietitian_id', '==', user.id),
        orderBy('created_at', 'desc')
      )
      const snap = await getDocs(q)
      setPatients(collData(snap))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>Patients</h1>
        <Link to="/patients/new" style={styles.addBtn}>+ Add</Link>
      </div>

      <input
        style={styles.search}
        type="text"
        placeholder="Search patients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.muted}>No patients found.</p>
      ) : (
        <div style={styles.list}>
          {filtered.map((p) => (
            <Link key={p.id} to={`/patients/${p.id}`} style={styles.card}>
              <div style={styles.avatar}>{p.full_name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <p style={styles.name}>{p.full_name}</p>
                <p style={styles.meta}>
                  {p.sex ? `${p.sex} · ` : ''}
                  {p.phone || 'No phone'}
                </p>
              </div>
              <span style={styles.chevron}>›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  heading: {
    fontSize: '1.4rem',
    color: 'var(--text-heading)',
    margin: 0,
  },
  addBtn: {
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    padding: '0.5rem 0.9rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  search: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
    outline: 'none',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--surface)',
    borderRadius: '10px',
    padding: '0.75rem',
    textDecoration: 'none',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#16a34a33',
    color: 'var(--success-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  name: {
    margin: 0,
    color: 'var(--text-heading)',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  meta: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    marginTop: '0.15rem',
  },
  chevron: {
    color: 'var(--text-muted)',
    fontSize: '1.3rem',
  },
}
