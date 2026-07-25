import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { collData } from '../lib/firestoreHelpers'
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

    const todayQuery = query(
      collection(db, 'appointments'),
      where('dietitian_id', '==', user.id),
      where('start_time', '>=', startOfToday.toISOString()),
      where('start_time', '<=', endOfToday.toISOString()),
      orderBy('start_time', 'asc')
    )
    const upcomingQuery = query(
      collection(db, 'appointments'),
      where('dietitian_id', '==', user.id),
      where('start_time', '>', endOfToday.toISOString()),
      where('status', '==', 'scheduled')
    )
    const activePatientsQuery = query(
      collection(db, 'patients'),
      where('dietitian_id', '==', user.id),
      where('status', '==', 'active')
    )

    const [todaySnap, upcomingCountSnap, activePatientsCountSnap] = await Promise.all([
      getDocs(todayQuery),
      getCountFromServer(upcomingQuery),
      getCountFromServer(activePatientsQuery),
    ])

    let todayAppts = collData(todaySnap)

    // Firestore has no relational joins, so pull each referenced patient's
    // name separately (there's usually only a handful of appointments today).
    const patientIds = [...new Set(todayAppts.map((a) => a.patient_id).filter(Boolean))]
    const patientNames = {}
    await Promise.all(
      patientIds.map(async (pid) => {
        const pSnap = await getDoc(doc(db, 'patients', pid))
        if (pSnap.exists()) patientNames[pid] = pSnap.data().full_name
      })
    )
    todayAppts = todayAppts.map((a) => ({
      ...a,
      patients: { full_name: patientNames[a.patient_id] },
    }))

    setTodayAppts(todayAppts)
    setStats({
      todayCount: todayAppts.length,
      upcomingCount: upcomingCountSnap.data().count,
      activePatients: activePatientsCountSnap.data().count,
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
    color: 'var(--text-heading)',
  },
  subheading: {
    fontSize: '1.1rem',
    margin: '1.5rem 0 0.75rem',
    color: 'var(--text-heading)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.6rem',
  },
  statCard: {
    background: 'var(--surface)',
    borderRadius: '10px',
    padding: '0.85rem 0.6rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--success-text)',
    margin: 0,
  },
  statLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  quickActions: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '1rem',
  },
  actionBtn: {
    flex: 1,
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    textAlign: 'center',
    padding: '0.65rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
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
  apptCard: {
    background: 'var(--surface)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apptPatient: {
    margin: 0,
    fontWeight: 600,
    color: 'var(--text-heading)',
    fontSize: '0.95rem',
  },
  apptTime: {
    margin: 0,
    color: 'var(--text-secondary)',
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
      status === 'completed' ? 'var(--success-text)' : status === 'cancelled' ? 'var(--danger-text)' : 'var(--info-text)',
  }),
}
