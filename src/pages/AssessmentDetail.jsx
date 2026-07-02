import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { bmiCategory } from '../lib/nutritionCalc'

export default function AssessmentDetail() {
  const { id: patientId, assessmentId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [assessmentId])

  async function load() {
    const { data } = await supabase
      .from('nutrition_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single()
    setAssessment(data)
    setLoading(false)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>
  if (!assessment) return <p style={styles.muted}>Assessment not found.</p>

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Nutrition Assessment</h1>
          <p style={styles.date}>{new Date(assessment.assessment_date).toLocaleDateString()}</p>
        </div>
        <Link to={`/patients/${patientId}/assessments/${assessmentId}/edit`} style={styles.editBtn}>
          <Pencil size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
          Edit
        </Link>
      </div>

      <Section title="Anthropometrics">
        <Row label="Weight" value={assessment.weight_kg ? `${assessment.weight_kg} kg` : null} />
        <Row label="Height" value={assessment.height_cm ? `${assessment.height_cm} cm` : null} />
        <Row label="BMI" value={assessment.bmi ? `${assessment.bmi} (${bmiCategory(assessment.bmi)})` : null} />
        <Row label="Waist circumference" value={assessment.waist_circumference_cm ? `${assessment.waist_circumference_cm} cm` : null} />
        <Row label="Mid-upper arm circ." value={assessment.mid_upper_arm_circumference_cm ? `${assessment.mid_upper_arm_circumference_cm} cm` : null} />
      </Section>

      <Section title="Estimated Requirements">
        <Row label="Energy" value={assessment.estimated_energy_kcal ? `${assessment.estimated_energy_kcal} kcal/day` : null} />
        <Row label="Protein" value={assessment.estimated_protein_g ? `${assessment.estimated_protein_g} g/day` : null} />
      </Section>

      <Section title="Dietary Assessment">
        <Row label="24-hour recall" value={assessment.recall_24hr} block />
        <Row label="FFQ notes" value={assessment.ffq_notes} block />
      </Section>

      <Section title="Clinical">
        <Row label="Biochemical data" value={assessment.biochemical_data} block />
        <Row label="Nutrition-focused exam" value={assessment.nutrition_focused_exam} block />
        <Row label="Medical history" value={assessment.medical_history_notes} block />
      </Section>

      <Section title="Nutrition Risk Screening">
        <span style={styles.riskBadge(assessment.nutrition_risk_level)}>
          {assessment.nutrition_risk_level} risk
        </span>
        {assessment.risk_screening_notes && (
          <p style={{ ...styles.rowValue, marginTop: '0.5rem' }}>{assessment.risk_screening_notes}</p>
        )}
      </Section>

      {assessment.notes && (
        <Section title="Additional Notes">
          <p style={styles.rowValue}>{assessment.notes}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionTitle}>{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, block }) {
  if (!value) return null
  return block ? (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={styles.rowLabel}>{label}</p>
      <p style={styles.rowValue}>{value}</p>
    </div>
  ) : (
    <p style={styles.rowInline}>
      <span style={styles.rowLabelInline}>{label}: </span>
      <span style={styles.rowValue}>{value}</span>
    </p>
  )
}

const styles = {
  muted: { color: '#64748b', fontSize: '0.9rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  heading: { color: '#fff', fontSize: '1.2rem', margin: 0 },
  date: { color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' },
  editBtn: {
    background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0',
    padding: '0.45rem 0.9rem', borderRadius: '8px', textDecoration: 'none',
    fontSize: '0.85rem', display: 'flex', alignItems: 'center',
  },
  section: { background: '#1e293b', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.6rem' },
  sectionTitle: {
    color: '#4ade80', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', margin: '0 0 0.5rem',
  },
  rowInline: { margin: '0.2rem 0', fontSize: '0.9rem' },
  rowLabelInline: { color: '#94a3b8' },
  rowLabel: { color: '#94a3b8', fontSize: '0.75rem', margin: '0 0 0.15rem' },
  rowValue: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' },
  riskBadge: (level) => ({
    display: 'inline-block', fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '999px',
    textTransform: 'capitalize',
    background: level === 'high' ? '#dc262633' : level === 'moderate' ? '#f59e0b33' : '#16a34a33',
    color: level === 'high' ? '#f87171' : level === 'moderate' ? '#fbbf24' : '#4ade80',
  }),
}
