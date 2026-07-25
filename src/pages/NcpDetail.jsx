import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, CheckCircle2, Circle } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { docData } from '../lib/firestoreHelpers'

export default function NcpDetail() {
  const { id: patientId, ncpId } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [ncpId])

  async function load() {
    const snap = await getDoc(doc(db, 'ncp_records', ncpId))
    setRecord(docData(snap))
    setLoading(false)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>
  if (!record) return <p style={styles.muted}>Record not found.</p>

  const goals = Array.isArray(record.smart_goals) ? record.smart_goals : []

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>NCP Record</h1>
          <p style={styles.date}>{new Date(record.record_date).toLocaleDateString()}</p>
        </div>
        <Link to={`/patients/${patientId}/ncp/${ncpId}/edit`} style={styles.editBtn}>
          <Pencil size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
          Edit
        </Link>
      </div>

      <span style={styles.statusBadge(record.status)}>{record.status}</span>

      {record.pes_statement && (
        <Section title="Diagnosis — PES Statement">
          <p style={styles.rowValue}>{record.pes_statement}</p>
        </Section>
      )}

      {(record.intervention_plan || record.intervention_goals) && (
        <Section title="Intervention">
          <Row label="Plan" value={record.intervention_plan} block />
          <Row label="Goals" value={record.intervention_goals} block />
        </Section>
      )}

      {goals.length > 0 && (
        <Section title="SMART Goals">
          {goals.map((g, i) => (
            <div key={i} style={styles.goalRow}>
              {g.achieved ? (
                <CheckCircle2 size={16} color="var(--success-text)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              ) : (
                <Circle size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              )}
              <div>
                <p style={styles.rowValue}>{g.text}</p>
                {g.target_date && (
                  <p style={styles.goalDate}>Target: {new Date(g.target_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {(record.monitoring_plan || record.evaluation_notes) && (
        <Section title="Monitoring & Evaluation">
          <Row label="Monitoring plan" value={record.monitoring_plan} block />
          <Row label="Evaluation notes" value={record.evaluation_notes} block />
        </Section>
      )}

      {(record.follow_up_date || record.follow_up_notes) && (
        <Section title="Follow-up">
          {record.follow_up_date && (
            <p style={styles.rowValue}>
              {new Date(record.follow_up_date).toLocaleDateString()}
            </p>
          )}
          {record.follow_up_notes && (
            <p style={{ ...styles.rowValue, marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
              {record.follow_up_notes}
            </p>
          )}
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
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <p style={styles.rowLabel}>{label}</p>
      <p style={styles.rowValue}>{value}</p>
    </div>
  )
}

const styles = {
  muted: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' },
  heading: { color: 'var(--text-heading)', fontSize: '1.2rem', margin: 0 },
  date: { color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0' },
  editBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
    padding: '0.45rem 0.9rem', borderRadius: '8px', textDecoration: 'none',
    fontSize: '0.85rem', display: 'flex', alignItems: 'center',
  },
  statusBadge: (status) => ({
    display: 'inline-block', fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '999px',
    textTransform: 'capitalize', marginBottom: '1rem',
    background: status === 'resolved' ? '#16a34a33' : status === 'ongoing' ? '#3b82f633' : '#f59e0b33',
    color: status === 'resolved' ? 'var(--success-text)' : status === 'ongoing' ? 'var(--info-text)' : 'var(--warning-text)',
  }),
  section: { background: 'var(--surface)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.6rem' },
  sectionTitle: {
    color: 'var(--success-text)', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', margin: '0 0 0.5rem',
  },
  rowLabel: { color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 0.15rem' },
  rowValue: { color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' },
  goalRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' },
  goalDate: { color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.15rem 0 0' },
}
