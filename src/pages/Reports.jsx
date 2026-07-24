import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { bmiCategory } from '../lib/nutritionCalc'

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalAssessments: 0,
    bmiBuckets: { Underweight: 0, 'Normal weight': 0, Overweight: 0, Obese: 0 },
    riskLevels: { low: 0, moderate: 0, high: 0 },
    apptsByStatus: { scheduled: 0, completed: 0, cancelled: 0 },
    newPatientsLast30d: 0,
  })

  useEffect(() => {
    if (user) loadReports()
  }, [user])

  async function loadReports() {
    setLoading(true)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [patientsRes, assessmentsRes, apptsRes] = await Promise.all([
      supabase.from('patients').select('id, status, created_at').eq('dietitian_id', user.id),
      supabase
        .from('nutrition_assessments')
        .select('weight_kg, height_cm, nutrition_risk_level, patients!inner(dietitian_id)')
        .eq('patients.dietitian_id', user.id),
      supabase.from('appointments').select('status').eq('dietitian_id', user.id),
    ])

    const patients = patientsRes.data || []
    const assessments = assessmentsRes.data || []
    const appts = apptsRes.data || []

    const bmiBuckets = { Underweight: 0, 'Normal weight': 0, Overweight: 0, Obese: 0 }
    const riskLevels = { low: 0, moderate: 0, high: 0 }

    for (const a of assessments) {
      if (a.weight_kg && a.height_cm) {
        const heightM = a.height_cm / 100
        const bmi = a.weight_kg / (heightM * heightM)
        const cat = bmiCategory(Math.round(bmi * 10) / 10)
        if (bmiBuckets[cat] !== undefined) bmiBuckets[cat] += 1
      }
      if (a.nutrition_risk_level && riskLevels[a.nutrition_risk_level] !== undefined) {
        riskLevels[a.nutrition_risk_level] += 1
      }
    }

    const apptsByStatus = { scheduled: 0, completed: 0, cancelled: 0 }
    for (const appt of appts) {
      if (apptsByStatus[appt.status] !== undefined) apptsByStatus[appt.status] += 1
    }

    const newPatientsLast30d = patients.filter(
      (p) => new Date(p.created_at) >= thirtyDaysAgo
    ).length

    setStats({
      totalPatients: patients.length,
      activePatients: patients.filter((p) => p.status === 'active').length,
      totalAssessments: assessments.length,
      bmiBuckets,
      riskLevels,
      apptsByStatus,
      newPatientsLast30d,
    })
    setLoading(false)
  }

  if (loading) return <p style={styles.muted}>Loading reports...</p>

  const bmiTotal = Object.values(stats.bmiBuckets).reduce((a, b) => a + b, 0)
  const riskTotal = Object.values(stats.riskLevels).reduce((a, b) => a + b, 0)

  return (
    <div>
      <h1 style={styles.heading}>Reports</h1>

      <div style={styles.statsGrid}>
        <StatCard label="Total Patients" value={stats.totalPatients} />
        <StatCard label="Active Patients" value={stats.activePatients} />
        <StatCard label="New (30 days)" value={stats.newPatientsLast30d} />
        <StatCard label="Assessments" value={stats.totalAssessments} />
      </div>

      <Section title="BMI Distribution">
        {bmiTotal === 0 ? (
          <p style={styles.muted}>No assessment data yet.</p>
        ) : (
          Object.entries(stats.bmiBuckets).map(([label, count]) => (
            <BarRow key={label} label={label} count={count} total={bmiTotal} />
          ))
        )}
      </Section>

      <Section title="Nutrition Risk Levels">
        {riskTotal === 0 ? (
          <p style={styles.muted}>No assessment data yet.</p>
        ) : (
          Object.entries(stats.riskLevels).map(([label, count]) => (
            <BarRow key={label} label={label} count={count} total={riskTotal} capitalize />
          ))
        )}
      </Section>

      <Section title="Appointments by Status">
        {Object.values(stats.apptsByStatus).reduce((a, b) => a + b, 0) === 0 ? (
          <p style={styles.muted}>No appointments yet.</p>
        ) : (
          Object.entries(stats.apptsByStatus).map(([label, count]) => (
            <BarRow
              key={label}
              label={label}
              count={count}
              total={Object.values(stats.apptsByStatus).reduce((a, b) => a + b, 0)}
              capitalize
            />
          ))
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

function BarRow({ label, count, total, capitalize }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={styles.barRow}>
      <div style={styles.barLabelRow}>
        <span style={{ ...styles.barLabel, ...(capitalize ? { textTransform: 'capitalize' } : {}) }}>
          {label}
        </span>
        <span style={styles.barCount}>{count}</span>
      </div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${pct}%` }} />
      </div>
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
  muted: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.6rem',
    marginBottom: '1.5rem',
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
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.1rem',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-heading)',
    marginBottom: '0.75rem',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  barRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  barLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  barLabel: {
    color: 'var(--text-secondary)',
  },
  barCount: {
    color: 'var(--text-heading)',
    fontWeight: 600,
  },
  barTrack: {
    height: '8px',
    borderRadius: '999px',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'var(--accent)',
  },
}
