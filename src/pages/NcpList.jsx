import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function NcpList() {
  const { id: patientId } = useParams()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [patientId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ncp_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false })
    if (!error) setRecords(data)
    setLoading(false)
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>
          <FileText size={20} style={{ marginRight: '0.5rem', verticalAlign: '-4px' }} />
          Nutrition Care Process
        </h1>
        <Link to={`/patients/${patientId}/ncp/new`} style={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
          New
        </Link>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : records.length === 0 ? (
        <p style={styles.muted}>No NCP records yet.</p>
      ) : (
        <div style={styles.list}>
          {records.map((r) => (
            <Link key={r.id} to={`/patients/${patientId}/ncp/${r.id}`} style={styles.card}>
              <div style={{ flex: 1 }}>
                <p style={styles.date}>{new Date(r.record_date).toLocaleDateString()}</p>
                <p style={styles.pes}>{r.pes_statement || 'No PES statement recorded'}</p>
                {r.follow_up_date && (
                  <p style={styles.followUp}>
                    Follow-up: {new Date(r.follow_up_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span style={styles.statusBadge(r.status)}>{r.status}</span>
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    background: 'var(--surface)', borderRadius: '10px', padding: '0.85rem 1rem', textDecoration: 'none', gap: '0.5rem',
  },
  date: { margin: 0, color: 'var(--text-heading)', fontWeight: 600, fontSize: '0.9rem' },
  pes: { margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 },
  followUp: { margin: '0.4rem 0 0', color: 'var(--info-text)', fontSize: '0.75rem' },
  statusBadge: (status) => ({
    fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'capitalize',
    background: status === 'resolved' ? '#16a34a33' : status === 'ongoing' ? '#3b82f633' : '#f59e0b33',
    color: status === 'resolved' ? 'var(--success-text)' : status === 'ongoing' ? 'var(--info-text)' : 'var(--warning-text)',
    flexShrink: 0,
  }),
}
