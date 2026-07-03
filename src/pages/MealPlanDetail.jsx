import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { scaleFoodNutrients, sumMealNutrients } from '../lib/chakudyaApi'

export default function MealPlanDetail() {
  const { id: patientId, planId } = useParams()
  const [plan, setPlan] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [planId])

  async function load() {
    const [planRes, patientRes] = await Promise.all([
      supabase.from('meal_plans').select('*').eq('id', planId).single(),
      supabase.from('patients').select('full_name').eq('id', patientId).single(),
    ])
    setPlan(planRes.data)
    setPatient(patientRes.data)
    setLoading(false)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>
  if (!plan) return <p style={styles.muted}>Meal plan not found.</p>

  const meals = plan.meals || []
  const totals = sumMealNutrients(meals)

  return (
    <div>
      <div style={styles.header} className="no-print">
        <div>
          <h1 style={styles.heading}>{plan.title}</h1>
          <p style={styles.meta}>
            {patient?.full_name} · {new Date(plan.plan_date).toLocaleDateString()}
            {plan.diet_type ? ` · ${plan.diet_type}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={styles.printBtn} onClick={() => window.print()}>
            <Printer size={14} />
          </button>
          <Link to={`/patients/${patientId}/meal-plans/${planId}/edit`} style={styles.editBtn}>
            <Pencil size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
            Edit
          </Link>
        </div>
      </div>

      <div style={styles.totalsBox}>
        <div><strong>{totals.kcal}</strong> kcal{plan.target_kcal ? ` / ${plan.target_kcal} target` : ''}</div>
        <div><strong>{totals.protein_g}g</strong> protein{plan.target_protein_g ? ` / ${plan.target_protein_g}g target` : ''}</div>
        <div>{totals.carbs_g}g carbs</div>
        <div>{totals.fat_g}g fat</div>
      </div>

      {meals.map((meal, i) => (
        <div key={i} style={styles.mealSection}>
          <p style={styles.mealName}>{meal.name}</p>
          {(!meal.items || meal.items.length === 0) ? (
            <p style={styles.emptyMeal}>No items.</p>
          ) : (
            meal.items.map((item, j) => {
              const scaled = scaleFoodNutrients(item, item.quantity || 1)
              return (
                <div key={j} style={styles.foodRow}>
                  <div>
                    <p style={styles.foodName}>
                      {item.food_name} {item.quantity !== 1 ? `× ${item.quantity}` : ''}
                    </p>
                    <p style={styles.foodMeasure}>{item.measure}</p>
                  </div>
                  <p style={styles.foodKcal}>{scaled.kcal} kcal</p>
                </div>
              )
            })
          )}
        </div>
      ))}

      {plan.notes && (
        <div style={styles.notesSection}>
          <p style={styles.sectionTitle}>Notes</p>
          <p style={styles.rowValue}>{plan.notes}</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  muted: { color: '#64748b', fontSize: '0.9rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  heading: { color: '#fff', fontSize: '1.2rem', margin: 0 },
  meta: { color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0' },
  printBtn: {
    background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0',
    padding: '0.45rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
  },
  editBtn: {
    background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0',
    padding: '0.45rem 0.9rem', borderRadius: '8px', textDecoration: 'none',
    fontSize: '0.85rem', display: 'flex', alignItems: 'center',
  },
  totalsBox: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
    background: '#16a34a1a', border: '1px solid #16a34a44', borderRadius: '8px',
    padding: '0.75rem 0.9rem', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '1rem',
  },
  mealSection: { background: '#1e293b', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.6rem' },
  mealName: { color: '#4ade80', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.5rem' },
  emptyMeal: { color: '#64748b', fontSize: '0.8rem', margin: 0 },
  foodRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.4rem 0', borderTop: '1px solid #334155',
  },
  foodName: { margin: 0, color: '#fff', fontSize: '0.85rem' },
  foodMeasure: { margin: '0.1rem 0 0', color: '#94a3b8', fontSize: '0.75rem' },
  foodKcal: { margin: 0, color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 },
  notesSection: { background: '#1e293b', borderRadius: '10px', padding: '0.85rem 1rem' },
  sectionTitle: {
    color: '#4ade80', fontSize: '0.75rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', margin: '0 0 0.4rem',
  },
  rowValue: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, whiteSpace: 'pre-wrap' },
}
