import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AppointmentForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [patients, setPatients] = useState([])
  const [patientId, setPatientId] = useState(searchParams.get('patient') || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [type, setType] = useState('in-person')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPatients()
    if (isEdit) loadAppointment()
  }, [id])

  async function loadPatients() {
    const { data } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('dietitian_id', user.id)
      .order('full_name')
    setPatients(data || [])
  }

  async function loadAppointment() {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (!error && data) {
      const start = new Date(data.start_time)
      const end = new Date(data.end_time)
      setPatientId(data.patient_id)
      setDate(start.toISOString().slice(0, 10))
      setTime(start.toTimeString().slice(0, 5))
      setDuration(Math.round((end - start) / 60000))
      setType(data.type)
      setNotes(data.notes || '')
      setStatus(data.status)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!patientId || !date || !time) {
      setError('Please fill in patient, date and time.')
      setSaving(false)
      return
    }

    const start = new Date(`${date}T${time}`)
    const end = new Date(start.getTime() + duration * 60000)

    const payload = {
      dietitian_id: user.id,
      patient_id: patientId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type,
      notes,
      status,
    }

    const result = isEdit
      ? await supabase.from('appointments').update(payload).eq('id', id)
      : await supabase.from('appointments').insert(payload)

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    navigate('/appointments')
  }

  async function handleDelete() {
    if (!confirm('Delete this appointment?')) return
    await supabase.from('appointments').delete().eq('id', id)
    navigate('/appointments')
  }

  if (loading) return <p style={styles.muted}>Loading...</p>

  return (
    <div>
      <h1 style={styles.heading}>{isEdit ? 'Edit Appointment' : 'New Appointment'}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Patient *">
          <select style={styles.input} required value={patientId}
            onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </Field>

        <div style={styles.row}>
          <Field label="Date *">
            <input style={styles.input} type="date" required value={date}
              onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time *">
            <input style={styles.input} type="time" required value={time}
              onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        <div style={styles.row}>
          <Field label="Duration (min)">
            <input style={styles.input} type="number" min="10" step="5" value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <Field label="Type">
            <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="in-person">In-person</option>
              <option value="tele">Teleconsultation</option>
            </select>
          </Field>
        </div>

        {isEdit && (
          <Field label="Status">
            <select style={styles.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-show</option>
            </select>
          </Field>
        )}

        <Field label="Notes">
          <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Appointment'}
          </button>
          {isEdit && (
            <button type="button" style={styles.deleteBtn} onClick={handleDelete}>Delete</button>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  )
}

const styles = {
  heading: { fontSize: '1.4rem', color: 'var(--text-heading)', marginBottom: '1rem' },
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  row: { display: 'flex', gap: '0.6rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  label: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
  input: {
    padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-heading)', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', width: '100%',
  },
  textarea: {
    padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-heading)', fontSize: '0.9rem', outline: 'none',
    minHeight: '70px', fontFamily: 'inherit', resize: 'vertical',
    boxSizing: 'border-box', width: '100%',
  },
  error: { color: 'var(--danger-text)', fontSize: '0.85rem' },
  actions: { display: 'flex', gap: '0.6rem', marginTop: '0.5rem' },
  saveBtn: {
    flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
    padding: '0.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
  deleteBtn: {
    background: 'var(--danger-banner-bg)', color: 'var(--danger-banner-text)', border: 'none',
    padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
}
