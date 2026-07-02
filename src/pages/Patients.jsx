import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('dietitian_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setPatients(data)
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
    color: '#fff',
    margin: 0,
  },
  addBtn: {
    background: '#16a34a',
    color: '#fff',
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
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  muted: {
    color: '#64748b',
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
    background: '#1e293b',
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
    color: '#4ade80',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  name: {
    margin: 0,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  meta: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.8rem',
    marginTop: '0.15rem',
  },
  chevron: {
    color: '#64748b',
    fontSize: '1.3rem',
  },
}
