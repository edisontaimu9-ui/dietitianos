import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  calculateBMI,
  bmiCategory,
  calculateEnergyNeeds,
  calculateProteinNeeds,
  calculateAge,
  ACTIVITY_FACTORS,
} from '../lib/nutritionCalc'

const emptyForm = {
  assessment_date: new Date().toISOString().slice(0, 10),
  weight_kg: '',
  height_cm: '',
  waist_circumference_cm: '',
  mid_upper_arm_circumference_cm: '',
  biochemical_data: '',
  recall_24hr: '',
  ffq_notes: '',
  nutrition_focused_exam: '',
  medical_history_notes: '',
  activity_factor: 1.2,
  protein_g_per_kg: 1.0,
  nutrition_risk_level: 'low',
  risk_screening_notes: '',
  notes: '',
}

export default function AssessmentForm() {
  const { id: patientId, assessmentId } = useParams()
  const isEdit = Boolean(assessmentId)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [patientId, assessmentId])

  async function load() {
    setLoading(true)
    const patientRes = await supabase.from('patients').select('*').eq('id', patientId).single()
    setPatient(patientRes.data)

    if (isEdit) {
      const { data } = await supabase
        .from('nutrition_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()
      if (data) {
        setForm({
          ...emptyForm,
          ...data,
          protein_g_per_kg: data.weight_kg ? Math.round((data.estimated_protein_g / data.weight_kg) * 10) / 10 : 1.0,
        })
      }
    }
    setLoading(false)
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const weight = parseFloat(form.weight_kg) || null
  const height = parseFloat(form.height_cm) || null
  const age = calculateAge(patient?.date_of_birth)
  const bmi = calculateBMI(weight, height)
  const energy = calculateEnergyNeeds({
    weightKg: weight,
    heightCm: height,
    age,
    sex: patient?.sex,
    activityFactor: parseFloat(form.activity_factor),
  })
  const protein = calculateProteinNeeds(weight, parseFloat(form.protein_g_per_kg))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      dietitian_id: user.id,
      patient_id: patientId,
      assessment_date: form.assessment_date,
      weight_kg: weight,
      height_cm: height,
      bmi,
      waist_circumference_cm: form.waist_circumference_cm ? parseFloat(form.waist_circumference_cm) : null,
      mid_upper_arm_circumference_cm: form.mid_upper_arm_circumference_cm
        ? parseFloat(form.mid_upper_arm_circumference_cm)
        : null,
      biochemical_data: form.biochemical_data,
      recall_24hr: form.recall_24hr,
      ffq_notes: form.ffq_notes,
      nutrition_focused_exam: form.nutrition_focused_exam,
      medical_history_notes: form.medical_history_notes,
      estimated_energy_kcal: energy,
      estimated_protein_g: protein,
      activity_factor: parseFloat(form.activity_factor),
      nutrition_risk_level: form.nutrition_risk_level,
      risk_screening_notes: form.risk_screening_notes,
      notes: form.notes,
    }

    const result = isEdit
      ? await supabase.from('nutrition_assessments').update(payload).eq('id', assessmentId)
      : await supabase.from('nutrition_assessments').insert(payload).select().single()

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    navigate(`/patients/${patientId}/assessments/${isEdit ? assessmentId : result.data.id}`)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>

  return (
    <div>
      <h1 style={styles.heading}>{isEdit ? 'Edit Assessment' : 'New Nutrition Assessment'}</h1>
      <p style={styles.subheading}>{patient?.full_name}</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Assessment date">
          <input style={styles.input} type="date" value={form.assessment_date}
            onChange={(e) => update('assessment_date', e.target.value)} />
        </Field>

        <SectionTitle>Anthropometrics</SectionTitle>

        <div style={styles.row}>
          <Field label="Weight (kg)">
            <input style={styles.input} type="number" step="0.1" value={form.weight_kg}
              onChange={(e) => update('weight_kg', e.target.value)} />
          </Field>
          <Field label="Height (cm)">
            <input style={styles.input} type="number" step="0.1" value={form.height_cm}
              onChange={(e) => update('height_cm', e.target.value)} />
          </Field>
        </div>

        {bmi && (
          <div style={styles.calcBox}>
            BMI: <strong>{bmi}</strong> ({bmiCategory(bmi)})
          </div>
        )}

        <div style={styles.row}>
          <Field label="Waist circumference (cm)">
            <input style={styles.input} type="number" step="0.1" value={form.waist_circumference_cm}
              onChange={(e) => update('waist_circumference_cm', e.target.value)} />
          </Field>
          <Field label="Mid-upper arm circ. (cm)">
            <input style={styles.input} type="number" step="0.1" value={form.mid_upper_arm_circumference_cm}
              onChange={(e) => update('mid_upper_arm_circumference_cm', e.target.value)} />
          </Field>
        </div>

        <SectionTitle>Estimated Requirements</SectionTitle>

        <Field label="Activity level (for energy calculation)">
          <select style={styles.input} value={form.activity_factor}
            onChange={(e) => update('activity_factor', e.target.value)}>
            {ACTIVITY_FACTORS.map((af) => (
              <option key={af.value} value={af.value}>{af.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Protein target (g/kg body weight)">
          <input style={styles.input} type="number" step="0.1" value={form.protein_g_per_kg}
            onChange={(e) => update('protein_g_per_kg', e.target.value)} />
        </Field>

        {(energy || protein) && (
          <div style={styles.calcBox}>
            {energy && <div>Estimated energy needs: <strong>{energy} kcal/day</strong></div>}
            {protein && <div>Estimated protein needs: <strong>{protein} g/day</strong></div>}
            {!age && <div style={styles.calcWarning}>Add date of birth to patient profile for accurate energy calc</div>}
          </div>
        )}

        <SectionTitle>Dietary Assessment</SectionTitle>

        <Field label="24-hour recall">
          <textarea style={styles.textarea} value={form.recall_24hr}
            onChange={(e) => update('recall_24hr', e.target.value)} />
        </Field>

        <Field label="Food Frequency Questionnaire notes">
          <textarea style={styles.textarea} value={form.ffq_notes}
            onChange={(e) => update('ffq_notes', e.target.value)} />
        </Field>

        <SectionTitle>Clinical</SectionTitle>

        <Field label="Biochemical data (labs)">
          <textarea style={styles.textarea} value={form.biochemical_data}
            onChange={(e) => update('biochemical_data', e.target.value)} />
        </Field>

        <Field label="Nutrition-focused physical exam">
          <textarea style={styles.textarea} value={form.nutrition_focused_exam}
            onChange={(e) => update('nutrition_focused_exam', e.target.value)} />
        </Field>

        <Field label="Medical history notes">
          <textarea style={styles.textarea} value={form.medical_history_notes}
            onChange={(e) => update('medical_history_notes', e.target.value)} />
        </Field>

        <SectionTitle>Nutrition Risk Screening</SectionTitle>

        <Field label="Risk level">
          <select style={styles.input} value={form.nutrition_risk_level}
            onChange={(e) => update('nutrition_risk_level', e.target.value)}>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </Field>

        <Field label="Risk screening notes">
          <textarea style={styles.textarea} value={form.risk_screening_notes}
            onChange={(e) => update('risk_screening_notes', e.target.value)} />
        </Field>

        <Field label="Additional notes">
          <textarea style={styles.textarea} value={form.notes}
            onChange={(e) => update('notes', e.target.value)} />
        </Field>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.saveBtn} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Assessment'}
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
  heading: { fontSize: '1.3rem', color: '#fff', margin: 0 },
  subheading: { color: '#94a3b8', fontSize: '0.9rem', margin: '0.2rem 0 1rem' },
  muted: { color: '#64748b', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  row: { display: 'flex', gap: '0.6rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  label: { color: '#94a3b8', fontSize: '0.8rem' },
  sectionTitle: {
    color: '#4ade80', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', margin: '0.5rem 0 -0.3rem',
  },
  input: {
    padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155',
    background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', width: '100%',
  },
  textarea: {
    padding: '0.65rem', borderRadius: '8px', border: '1px solid #334155',
    background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none',
    minHeight: '70px', fontFamily: 'inherit', resize: 'vertical',
    boxSizing: 'border-box', width: '100%',
  },
  calcBox: {
    background: '#16a34a1a', border: '1px solid #16a34a44', borderRadius: '8px',
    padding: '0.65rem 0.85rem', color: '#4ade80', fontSize: '0.85rem', lineHeight: 1.6,
  },
  calcWarning: { color: '#fbbf24', fontSize: '0.75rem', marginTop: '0.3rem' },
  error: { color: '#f87171', fontSize: '0.85rem' },
  saveBtn: {
    background: '#16a34a', color: '#fff', border: 'none', padding: '0.8rem',
    borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem',
  },
}
