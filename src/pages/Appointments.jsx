import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    if (user) load()
  }, [user, filter])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*, patients(full_name)')
      .eq('dietitian_id', user.id)

    const now = new Date().toISOString()
    if (filter === 'upcoming') {
      query = query.gte('start_time', now).order('start_time', { ascending: true })
    } else {
      query = query.lt('start_time', now).order('start_time', { ascending: false })
    }

    const { data, error } = await query.limit(50)
    if (!error) setAppointments(data)
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    load()
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>Appointments</h1>
        <Link to="/appointments/new" style={styles.addBtn}>+ New</Link>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(filter === 'upcoming' ? styles.tabActive : {}) }}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          style={{ ...styles.tab, ...(filter === 'past' ? styles.tabActive : {}) }}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : appointments.length === 0 ? (
        <p style={styles.muted}>No {filter} appointments.</p>
      ) : (
        <div style={styles.list}>
          {appointments.map((a) => (
            <div key={a.id} style={styles.card}>
              <Link to={`/appointments/${a.id}/edit`} style={styles.cardMain}>
                <p style={styles.patient}>{a.patients?.full_name || 'Unknown patient'}</p>
                <p style={styles.time}>
                  {new Date(a.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {' · '}
                  {new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {a.type === 'tele' ? 'Tele' : 'In-person'}
                </p>
              </Link>
              <div style={styles.actionsRow}>
                <span style={styles.badge(a.status)}>{a.status}</span>
                {filter === 'upcoming' && a.status === 'scheduled' && (
                  <div style={styles.quickActions}>
                    <button style={styles.quickBtn} onClick={() => updateStatus(a.id, 'completed')}>Done</button>
                    <button style={styles.quickBtnCancel} onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  heading: { fontSize: '1.4rem', color: 'var(--text-heading)', margin: 0 },
  addBtn: {
    background: 'var(--accent)', color: '#fff', padding: '0.5rem 0.9rem',
    borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
  },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  tab: {
    background: 'var(--surface)', color: 'var(--text-secondary)', border: 'none',
    padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer',
  },
  tabActive: { background: '#16a34a33', color: 'var(--success-text)', fontWeight: 600 },
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  card: { background: 'var(--surface)', borderRadius: '10px', padding: '0.75rem 1rem' },
  cardMain: { textDecoration: 'none', display: 'block' },
  patient: { margin: 0, color: 'var(--text-heading)', fontWeight: 600, fontSize: '0.95rem' },
  time: { margin: '0.15rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' },
  actionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' },
  badge: (status) => ({
    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', textTransform: 'capitalize',
    background: status === 'completed' ? '#16a34a33' : status === 'cancelled' ? '#dc262633' : '#3b82f633',
    color: status === 'completed' ? 'var(--success-text)' : status === 'cancelled' ? 'var(--danger-text)' : 'var(--info-text)',
  }),
  quickActions: { display: 'flex', gap: '0.4rem' },
  quickBtn: {
    background: '#16a34a22', color: 'var(--success-text)', border: 'none',
    padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
  },
  quickBtnCancel: {
    background: '#dc262622', color: 'var(--danger-text)', border: 'none',
    padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer',
  },
}
