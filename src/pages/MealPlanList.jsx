import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Utensils, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sumMealNutrients } from '../lib/chakudyaApi'

export default function MealPlanList() {
  const { id: patientId } = useParams()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [patientId])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('plan_date', { ascending: false })
    if (!error) setPlans(data)
    setLoading(false)
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.heading}>
          <Utensils size={20} style={{ marginRight: '0.5rem', verticalAlign: '-4px' }} />
          Meal Plans
        </h1>
        <Link to={`/patients/${patientId}/meal-plans/new`} style={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
          New
        </Link>
      </div>

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : plans.length === 0 ? (
        <p style={styles.muted}>No meal plans yet.</p>
      ) : (
        <div style={styles.list}>
          {plans.map((p) => {
            const totals = sumMealNutrients(p.meals || [])
            return (
              <Link key={p.id} to={`/patients/${patientId}/meal-plans/${p.id}`} style={styles.card}>
                <div>
                  <p style={styles.title}>{p.title}</p>
                  <p style={styles.meta}>
                    {new Date(p.plan_date).toLocaleDateString()}
                    {p.diet_type ? ` · ${p.diet_type}` : ''}
                  </p>
                  <p style={styles.kcal}>{totals.kcal} kcal · {totals.protein_g}g protein</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  heading: { fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center' },
  addBtn: {
    background: '#16a34a', color: '#fff', padding: '0.5rem 0.9rem', borderRadius: '8px',
    textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center',
  },
  muted: { color: '#64748b', fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  card: { background: '#1e293b', borderRadius: '10px', padding: '0.85rem 1rem', textDecoration: 'none' },
  title: { margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.95rem' },
  meta: { margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' },
  kcal: { margin: '0.4rem 0 0', color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 },
}
