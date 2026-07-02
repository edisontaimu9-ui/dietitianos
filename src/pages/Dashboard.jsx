import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    todayCount: 0,
    upcomingCount: 0,
    activePatients: 0,
  })
  const [todayAppts, setTodayAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  async function loadDashboard() {
    setLoading(true)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const [todayRes, upcomingRes, patientsRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, patients(full_name)')
        .eq('dietitian_id', user.id)
        .gte('start_time', startOfToday.toISOString())
        .lte('start_time', endOfToday.toISOString())
        .order('start_time', { ascending: true }),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('dietitian_id', user.id)
        .gt('start_time', endOfToday.toISOString())
        .eq('status', 'scheduled'),
      supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('dietitian_id', user.id)
        .eq('status', 'active'),
    ])

    setTodayAppts(todayRes.data || [])
    setStats({
      todayCount: todayRes.data?.length || 0,
      upcomingCount: upcomingRes.count || 0,
      activePatients: patientsRes.count || 0,
    })
    setLoading(false)
  }

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>

      <div style={styles.statsGrid}>
        <StatCard label="Today's Appointments" value={stats.todayCount} />
        <StatCard label="Upcoming" value={stats.upcomingCount} />
        <StatCard label="Active Patients" value={stats.activePatients} />
      </div>

      <div style={styles.quickActions}>
        <Link to="/patients" style={styles.actionBtn}>+ New Patient</Link>
        <Link to="/appointments" style={styles.actionBtn}>+ New Appointment</Link>
      </div>

      <h2 style={styles.subheading}>Today's Schedule</h2>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : todayAppts.length === 0 ? (
        <p style={styles.muted}>No appointments today.</p>
      ) : (
        <div style={styles.list}>
          {todayAppts.map((appt) => (
            <div key={appt.id} style={styles.apptCard}>
              <div>
                <p style={styles.apptPatient}>{appt.patients?.full_name || 'Unknown patient'}</p>
                <p style={styles.apptTime}>
                  {new Date(appt.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' · '}
                  {appt.type === 'tele' ? 'Teleconsultation' : 'In-person'}
                </p>
              </div>
              <span style={styles.statusBadge(appt.status)}>{appt.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  )
}

const styles = {
  heading: {
    fontSize: '1.4rem',
    marginBottom: '1rem',
    color: '#fff',
  },
  subheading: {
    fontSize: '1.1rem',
    margin: '1.5rem 0 0.75rem',
    color: '#fff',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.6rem',
  },
  statCard: {
    background: '#1e293b',
    borderRadius: '10px',
    padding: '0.85rem 0.6rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#4ade80',
    margin: 0,
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '0.25rem',
  },
  quickActions: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '1rem',
  },
  actionBtn: {
    flex: 1,
    background: '#16a34a',
    color: '#fff',
    textAlign: 'center',
    padding: '0.65rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
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
  apptCard: {
    background: '#1e293b',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apptPatient: {
    margin: 0,
    fontWeight: 600,
    color: '#fff',
    fontSize: '0.95rem',
  },
  apptTime: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.8rem',
    marginTop: '0.15rem',
  },
  statusBadge: (status) => ({
    fontSize: '0.7rem',
    padding: '0.25rem 0.6rem',
    borderRadius: '999px',
    textTransform: 'capitalize',
    background:
      status === 'completed' ? '#16a34a33' : status === 'cancelled' ? '#dc262633' : '#3b82f633',
    color:
      status === 'completed' ? '#4ade80' : status === 'cancelled' ? '#f87171' : '#60a5fa',
  }),
}
