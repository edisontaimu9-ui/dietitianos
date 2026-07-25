import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { docData } from '../lib/firestoreHelpers'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  full_name: '',
  date_of_birth: '',
  sex: '',
  phone: '',
  email: '',
  address: '',
  allergies: '',
  medications: '',
  medical_history: '',
  notes: '',
}

export default function PatientForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) loadPatient()
  }, [id])

  async function loadPatient() {
    const snap = await getDoc(doc(db, 'patients', id))
    const data = docData(snap)
    if (data) {
      setForm({ ...emptyForm, ...data })
    }
    setLoading(false)
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = { ...form, dietitian_id: user.id }
    delete payload.id
    delete payload.created_at
    delete payload.updated_at

    try {
      let newId = id
      if (isEdit) {
        await updateDoc(doc(db, 'patients', id), { ...payload, updated_at: serverTimestamp() })
      } else {
        const ref = await addDoc(collection(db, 'patients'), {
          ...payload,
          status: payload.status || 'active',
          created_at: serverTimestamp(),
        })
        newId = ref.id
      }
      setSaving(false)
      navigate(isEdit ? `/patients/${id}` : `/patients/${newId}`)
    } catch (err) {
      setSaving(false)
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this patient? This cannot be undone.')) return
    await deleteDoc(doc(db, 'patients', id))
    navigate('/patients')
  }

  if (loading) return <p style={styles.muted}>Loading...</p>

  return (
    <div>
      <h1 style={styles.heading}>{isEdit ? 'Edit Patient' : 'New Patient'}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Full name *">
          <input style={styles.input} required value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)} />
        </Field>

        <div style={styles.row}>
          <Field label="Date of birth">
            <input style={styles.input} type="date" value={form.date_of_birth || ''}
              onChange={(e) => update('date_of_birth', e.target.value)} />
          </Field>
          <Field label="Sex">
            <select style={styles.input} value={form.sex || ''}
              onChange={(e) => update('sex', e.target.value)}>
              <option value="">—</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>

        <div style={styles.row}>
          <Field label="Phone">
            <input style={styles.input} value={form.phone || ''}
              onChange={(e) => update('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input style={styles.input} type="email" value={form.email || ''}
              onChange={(e) => update('email', e.target.value)} />
          </Field>
        </div>

        <Field label="Address">
          <input style={styles.input} value={form.address || ''}
            onChange={(e) => update('address', e.target.value)} />
        </Field>

        <Field label="Allergies">
          <textarea style={styles.textarea} value={form.allergies || ''}
            onChange={(e) => update('allergies', e.target.value)} />
        </Field>

        <Field label="Medications">
          <textarea style={styles.textarea} value={form.medications || ''}
            onChange={(e) => update('medications', e.target.value)} />
        </Field>

        <Field label="Medical history">
          <textarea style={styles.textarea} value={form.medical_history || ''}
            onChange={(e) => update('medical_history', e.target.value)} />
        </Field>

        <Field label="Notes">
          <textarea style={styles.textarea} value={form.notes || ''}
            onChange={(e) => update('notes', e.target.value)} />
        </Field>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button type="submit" style={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Patient'}
          </button>
          {isEdit && (
            <button type="button" style={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
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
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  textarea: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
    outline: 'none',
    minHeight: '70px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    width: '100%',
  },
  error: { color: 'var(--danger-text)', fontSize: '0.85rem' },
  actions: { display: 'flex', gap: '0.6rem', marginTop: '0.5rem' },
  saveBtn: {
    flex: 1,
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'var(--danger-banner-bg)',
    color: 'var(--danger-banner-text)',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
}
