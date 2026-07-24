import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    const [patientRes, apptRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(10),
    ])
    setPatient(patientRes.data)
    setAppointments(apptRes.data || [])
    setLoading(false)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>
  if (!patient) return <p style={styles.muted}>Patient not found.</p>

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth)) / 31557600000)
    : null

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.name}>{patient.full_name}</h1>
          <p style={styles.meta}>
            {age !== null ? `${age} yrs · ` : ''}
            {patient.sex || ''}
          </p>
        </div>
        <Link to={`/patients/${id}/edit`} style={styles.editBtn}>Edit</Link>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Contact</p>
        <p style={styles.row}>{patient.phone || '—'}</p>
        <p style={styles.row}>{patient.email || '—'}</p>
        <p style={styles.row}>{patient.address || '—'}</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Allergies</p>
        <p style={styles.row}>{patient.allergies || 'None recorded'}</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Medications</p>
        <p style={styles.row}>{patient.medications || 'None recorded'}</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Medical History</p>
        <p style={styles.row}>{patient.medical_history || 'None recorded'}</p>
      </div>

      {patient.notes && (
        <div style={styles.section}>
          <p style={styles.sectionTitle}>Notes</p>
          <p style={styles.row}>{patient.notes}</p>
        </div>
      )}

      <div style={styles.section}>
        <div style={styles.apptHeader}>
          <p style={styles.sectionTitle}>Nutrition Assessments</p>
          <Link to={`/patients/${id}/assessments/new`} style={styles.smallLink}>+ New</Link>
        </div>
        <Link to={`/patients/${id}/assessments`} style={styles.viewAllLink}>View all assessments →</Link>
      </div>

      <div style={styles.section}>
        <div style={styles.apptHeader}>
          <p style={styles.sectionTitle}>Nutrition Care Process</p>
          <Link to={`/patients/${id}/ncp/new`} style={styles.smallLink}>+ New</Link>
        </div>
        <Link to={`/patients/${id}/ncp`} style={styles.viewAllLink}>View all NCP records →</Link>
      </div>

      <div style={styles.section}>
        <div style={styles.apptHeader}>
          <p style={styles.sectionTitle}>Meal Plans</p>
          <Link to={`/patients/${id}/meal-plans/new`} style={styles.smallLink}>+ New</Link>
        </div>
        <Link to={`/patients/${id}/meal-plans`} style={styles.viewAllLink}>View all meal plans →</Link>
      </div>

      <div style={styles.section}>
        <div style={styles.apptHeader}>
          <p style={styles.sectionTitle}>Recent Appointments</p>
          <Link to={`/appointments/new?patient=${id}`} style={styles.smallLink}>+ New</Link>
        </div>
        {appointments.length === 0 ? (
          <p style={styles.row}>No appointments yet.</p>
        ) : (
          appointments.map((a) => (
            <div key={a.id} style={styles.apptRow}>
              <span>{new Date(a.start_time).toLocaleDateString()} · {new Date(a.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span style={styles.badge(a.status)}>{a.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  name: { color: 'var(--text-heading)', fontSize: '1.3rem', margin: 0 },
  meta: { color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' },
  editBtn: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.85rem',
  },
  section: {
    background: 'var(--surface)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
    marginBottom: '0.6rem',
  },
  sectionTitle: {
    color: 'var(--success-text)',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 0.4rem',
  },
  row: { color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0.2rem 0' },
  apptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  smallLink: { color: 'var(--info-text)', fontSize: '0.8rem', textDecoration: 'none' },
  viewAllLink: { color: 'var(--info-text)', fontSize: '0.85rem', textDecoration: 'none' },
  apptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderTop: '1px solid var(--border)',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
  badge: (status) => ({
    fontSize: '0.7rem',
    padding: '0.2rem 0.55rem',
    borderRadius: '999px',
    textTransform: 'capitalize',
    background:
      status === 'completed' ? '#16a34a33' : status === 'cancelled' ? '#dc262633' : '#3b82f633',
    color:
      status === 'completed' ? 'var(--success-text)' : status === 'cancelled' ? 'var(--danger-text)' : 'var(--info-text)',
  }),
}
