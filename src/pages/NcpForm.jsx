import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, CalendarPlus } from 'lucide-react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { collData, docData } from '../lib/firestoreHelpers'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  record_date: new Date().toISOString().slice(0, 10),
  assessment_id: '',
  problem: '',
  etiology: '',
  signs_symptoms: '',
  intervention_plan: '',
  intervention_goals: '',
  monitoring_plan: '',
  evaluation_notes: '',
  follow_up_date: '',
  follow_up_notes: '',
  status: 'active',
}

function buildPES(problem, etiology, signs) {
  if (!problem) return ''
  let pes = problem
  if (etiology) pes += ` related to ${etiology}`
  if (signs) pes += ` as evidenced by ${signs}`
  return pes + '.'
}

export default function NcpForm() {
  const { id: patientId, ncpId } = useParams()
  const isEdit = Boolean(ncpId)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creatingAppt, setCreatingAppt] = useState(false)
  const [apptCreated, setApptCreated] = useState(false)

  useEffect(() => {
    load()
  }, [patientId, ncpId])

  async function load() {
    setLoading(true)
    const [patientSnap, assessmentsSnap] = await Promise.all([
      getDoc(doc(db, 'patients', patientId)),
      getDocs(
        query(
          collection(db, 'nutrition_assessments'),
          where('patient_id', '==', patientId),
          orderBy('assessment_date', 'desc')
        )
      ),
    ])
    setPatient(docData(patientSnap))
    setAssessments(collData(assessmentsSnap))

    if (isEdit) {
      const snap = await getDoc(doc(db, 'ncp_records', ncpId))
      const data = docData(snap)
      if (data) {
        setForm({ ...emptyForm, ...data, assessment_id: data.assessment_id || '' })
        setGoals(Array.isArray(data.smart_goals) ? data.smart_goals : [])
      }
    }
    setLoading(false)
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addGoal() {
    setGoals((g) => [...g, { text: '', target_date: '', achieved: false }])
  }

  function updateGoal(index, field, value) {
    setGoals((g) => g.map((goal, i) => (i === index ? { ...goal, [field]: value } : goal)))
  }

  function removeGoal(index) {
    setGoals((g) => g.filter((_, i) => i !== index))
  }

  const pesPreview = buildPES(form.problem, form.etiology, form.signs_symptoms)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      dietitian_id: user.id,
      patient_id: patientId,
      assessment_id: form.assessment_id || null,
      record_date: form.record_date,
      problem: form.problem,
      etiology: form.etiology,
      signs_symptoms: form.signs_symptoms,
      pes_statement: pesPreview,
      intervention_plan: form.intervention_plan,
      intervention_goals: form.intervention_goals,
      smart_goals: goals,
      monitoring_plan: form.monitoring_plan,
      evaluation_notes: form.evaluation_notes,
      follow_up_date: form.follow_up_date || null,
      follow_up_notes: form.follow_up_notes,
      status: form.status,
    }

    try {
      let newId = ncpId
      if (isEdit) {
        await updateDoc(doc(db, 'ncp_records', ncpId), payload)
      } else {
        const ref = await addDoc(collection(db, 'ncp_records'), payload)
        newId = ref.id
      }
      setSaving(false)
      navigate(`/patients/${patientId}/ncp/${newId}`)
    } catch (err) {
      setSaving(false)
      setError(err.message)
    }
  }

  async function handleCreateFollowUpAppointment() {
    if (!form.follow_up_date) return
    setCreatingAppt(true)

    const startTime = new Date(`${form.follow_up_date}T09:00`)
    const endTime = new Date(startTime.getTime() + 30 * 60000)

    try {
      await addDoc(collection(db, 'appointments'), {
        dietitian_id: user.id,
        patient_id: patientId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        type: 'in-person',
        status: 'scheduled',
        notes: form.follow_up_notes || 'Follow-up appointment',
      })
      setApptCreated(true)
    } catch (err) {
      console.error(err)
    }
    setCreatingAppt(false)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>

  return (
    <div>
      <h1 style={styles.heading}>{isEdit ? 'Edit NCP Record' : 'New NCP Record'}</h1>
      <p style={styles.subheading}>{patient?.full_name}</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Record date">
          <input style={styles.input} type="date" value={form.record_date}
            onChange={(e) => update('record_date', e.target.value)} />
        </Field>

        {assessments.length > 0 && (
          <Field label="Linked assessment (optional)">
            <select style={styles.input} value={form.assessment_id}
              onChange={(e) => update('assessment_id', e.target.value)}>
              <option value="">None</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.assessment_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </Field>
        )}

        <SectionTitle>Diagnosis — PES Statement</SectionTitle>

        <Field label="Problem (diagnostic label)">
          <input style={styles.input} placeholder="e.g. Excessive energy intake"
            value={form.problem} onChange={(e) => update('problem', e.target.value)} />
        </Field>

        <Field label="Etiology (related to)">
          <input style={styles.input} placeholder="e.g. lack of nutrition knowledge"
            value={form.etiology} onChange={(e) => update('etiology', e.target.value)} />
        </Field>

        <Field label="Signs/Symptoms (as evidenced by)">
          <input style={styles.input} placeholder="e.g. BMI 35.4, reported daily fast food intake"
            value={form.signs_symptoms} onChange={(e) => update('signs_symptoms', e.target.value)} />
        </Field>

        {pesPreview && (
          <div style={styles.calcBox}>
            <strong>PES Statement:</strong><br />{pesPreview}
          </div>
        )}

        <SectionTitle>Intervention</SectionTitle>

        <Field label="Intervention plan">
          <textarea style={styles.textarea} value={form.intervention_plan}
            onChange={(e) => update('intervention_plan', e.target.value)} />
        </Field>

        <Field label="Intervention goals">
          <textarea style={styles.textarea} value={form.intervention_goals}
            onChange={(e) => update('intervention_goals', e.target.value)} />
        </Field>

        <SectionTitle>SMART Goals</SectionTitle>

        {goals.map((goal, i) => (
          <div key={i} style={styles.goalRow}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="e.g. Reduce weight by 5% in 3 months"
              value={goal.text}
              onChange={(e) => updateGoal(i, 'text', e.target.value)}
            />
            <input
              style={styles.goalDate}
              type="date"
              value={goal.target_date}
              onChange={(e) => updateGoal(i, 'target_date', e.target.value)}
            />
            <button type="button" style={styles.removeBtn} onClick={() => removeGoal(i)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button type="button" style={styles.addGoalBtn} onClick={addGoal}>
          <Plus size={16} style={{ marginRight: '0.3rem', verticalAlign: '-3px' }} />
          Add SMART goal
        </button>

        <SectionTitle>Monitoring & Evaluation</SectionTitle>

        <Field label="Monitoring plan">
          <textarea style={styles.textarea} value={form.monitoring_plan}
            onChange={(e) => update('monitoring_plan', e.target.value)} />
        </Field>

        <Field label="Evaluation notes">
          <textarea style={styles.textarea} value={form.evaluation_notes}
            onChange={(e) => update('evaluation_notes', e.target.value)} />
        </Field>

        <SectionTitle>Follow-up</SectionTitle>

        <Field label="Follow-up date">
          <input style={styles.input} type="date" value={form.follow_up_date}
            onChange={(e) => update('follow_up_date', e.target.value)} />
        </Field>

        <Field label="Follow-up notes">
          <textarea style={styles.textarea} value={form.follow_up_notes}
            onChange={(e) => update('follow_up_notes', e.target.value)} />
        </Field>

        {form.follow_up_date && (
          <button
            type="button"
            style={styles.apptBtn}
            onClick={handleCreateFollowUpAppointment}
            disabled={creatingAppt || apptCreated}
          >
            <CalendarPlus size={16} style={{ marginRight: '0.4rem', verticalAlign: '-3px' }} />
            {apptCreated ? 'Appointment created ✓' : creatingAppt ? 'Creating...' : 'Create appointment for follow-up'}
          </button>
        )}

        <Field label="Status">
          <select style={styles.input} value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="ongoing">Ongoing</option>
            <option value="resolved">Resolved</option>
          </select>
        </Field>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.saveBtn} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create NCP Record'}
        </button>
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

function SectionTitle({ children }) {
  return <p style={styles.sectionTitle}>{children}</p>
}

const styles = {
  heading: { fontSize: '1.3rem', color: 'var(--text-heading)', margin: 0 },
  subheading: { color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.2rem 0 1rem' },
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
  sectionTitle: {
    color: 'var(--success-text)', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', margin: '0.5rem 0 -0.3rem',
  },
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
  calcBox: {
    background: '#16a34a1a', border: '1px solid #16a34a44', borderRadius: '8px',
    padding: '0.65rem 0.85rem', color: 'var(--success-text)', fontSize: '0.85rem', lineHeight: 1.6,
  },
  goalRow: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  goalDate: {
    padding: '0.65rem 0.4rem', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-heading)', fontSize: '0.8rem', outline: 'none', width: '130px',
  },
  removeBtn: {
    background: '#7f1d1d33', border: 'none', color: 'var(--danger-text)', borderRadius: '8px',
    padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  addGoalBtn: {
    background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--text-secondary)',
    borderRadius: '8px', padding: '0.6rem', fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  apptBtn: {
    background: '#3b82f622', border: '1px solid #3b82f644', color: 'var(--info-text)',
    borderRadius: '8px', padding: '0.65rem', fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  error: { color: 'var(--danger-text)', fontSize: '0.85rem' },
  saveBtn: {
    background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.8rem',
    borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem',
  },
}
