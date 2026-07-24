import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { bmiCategory } from '../lib/nutritionCalc'

export default function AssessmentList() {
  const { id: patientId } = useParams()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [patientId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('nutrition_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_date', { ascending: false })
    if (!error) setAssessments(data)
    setLoading(false)
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>
          <ClipboardList size={20} style={{ marginRight: '0.5rem', verticalAlign: '-4px' }} />
          Nutrition Assessments
        </h1>
        <Link to={`/patients/${patientId}/assessments/new`} style={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
          New
        </Link>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : assessments.length === 0 ? (
        <p style={styles.muted}>No assessments recorded yet.</p>
      ) : (
        <div style={styles.list}>
          {assessments.map((a) => (
            <Link key={a.id} to={`/patients/${patientId}/assessments/${a.id}`} style={styles.card}>
              <div>
                <p style={styles.date}>{new Date(a.assessment_date).toLocaleDateString()}</p>
                <p style={styles.meta}>
                  {a.weight_kg ? `${a.weight_kg} kg` : '—'}
                  {a.bmi ? ` · BMI ${a.bmi} (${bmiCategory(a.bmi)})` : ''}
                </p>
              </div>
              <span style={styles.riskBadge(a.nutrition_risk_level)}>
                {a.nutrition_risk_level} risk
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  heading: { fontSize: '1.2rem', color: 'var(--text-heading)', margin: 0, display: 'flex', alignItems: 'center' },
  addBtn: {
    background: 'var(--accent)', color: '#fff', padding: '0.5rem 0.9rem', borderRadius: '8px',
    textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center',
  },
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  card: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--surface)', borderRadius: '10px', padding: '0.85rem 1rem', textDecoration: 'none',
  },
  date: { margin: 0, color: 'var(--text-heading)', fontWeight: 600, fontSize: '0.9rem' },
  meta: { margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' },
  riskBadge: (level) => ({
    fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'capitalize',
    background: level === 'high' ? '#dc262633' : level === 'moderate' ? '#f59e0b33' : '#16a34a33',
    color: level === 'high' ? 'var(--danger-text)' : level === 'moderate' ? 'var(--warning-text)' : 'var(--success-text)',
  }),
}
