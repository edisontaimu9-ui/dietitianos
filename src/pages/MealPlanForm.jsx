import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { searchFoods, scaleFoodNutrients, sumMealNutrients } from '../lib/chakudyaApi'

const DEFAULT_MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export default function MealPlanForm() {
  const { id: patientId, planId } = useParams()
  const isEdit = Boolean(planId)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [title, setTitle] = useState('')
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10))
  const [dietType, setDietType] = useState('')
  const [targetKcal, setTargetKcal] = useState('')
  const [targetProtein, setTargetProtein] = useState('')
  const [notes, setNotes] = useState('')
  const [meals, setMeals] = useState(DEFAULT_MEALS.map((name) => ({ name, items: [] })))

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [searchingMealIndex, setSearchingMealIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    load()
  }, [patientId, planId])

  async function load() {
    setLoading(true)
    const patientRes = await supabase.from('patients').select('*').eq('id', patientId).single()
    setPatient(patientRes.data)

    if (isEdit) {
      const { data } = await supabase.from('meal_plans').select('*').eq('id', planId).single()
      if (data) {
        setTitle(data.title)
        setPlanDate(data.plan_date)
        setDietType(data.diet_type || '')
        setTargetKcal(data.target_kcal || '')
        setTargetProtein(data.target_protein_g || '')
        setNotes(data.notes || '')
        setMeals(Array.isArray(data.meals) && data.meals.length ? data.meals : DEFAULT_MEALS.map((name) => ({ name, items: [] })))
      }
    }
    setLoading(false)
  }

  async function runSearch(q) {
    setSearchQuery(q)
    if (!q || q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const results = await searchFoods(q, { limit: 15 })
      setSearchResults(results)
    } catch (e) {
      setSearchResults([])
    }
    setSearching(false)
  }

  function openSearch(mealIndex) {
    setSearchingMealIndex(mealIndex)
    setSearchQuery('')
    setSearchResults([])
  }

  function closeSearch() {
    setSearchingMealIndex(null)
    setSearchQuery('')
    setSearchResults([])
  }

  function addFoodToMeal(food) {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === searchingMealIndex
          ? { ...meal, items: [...meal.items, { ...food, quantity: 1 }] }
          : meal
      )
    )
    closeSearch()
  }

  function updateItemQuantity(mealIndex, itemIndex, quantity) {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === mealIndex
          ? {
              ...meal,
              items: meal.items.map((item, j) =>
                j === itemIndex ? { ...item, quantity: parseFloat(quantity) || 0 } : item
              ),
            }
          : meal
      )
    )
  }

  function removeItem(mealIndex, itemIndex) {
    setMeals((prev) =>
      prev.map((meal, i) =>
        i === mealIndex ? { ...meal, items: meal.items.filter((_, j) => j !== itemIndex) } : meal
      )
    )
  }

  function addMealSection() {
    const name = prompt('Meal section name (e.g. "Mid-morning snack")')
    if (name) setMeals((prev) => [...prev, { name, items: [] }])
  }

  function removeMealSection(index) {
    setMeals((prev) => prev.filter((_, i) => i !== index))
  }

  const totals = sumMealNutrients(meals)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title) {
      setError('Please enter a title for the plan.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      dietitian_id: user.id,
      patient_id: patientId,
      title,
      plan_date: planDate,
      diet_type: dietType,
      target_kcal: targetKcal ? parseFloat(targetKcal) : null,
      target_protein_g: targetProtein ? parseFloat(targetProtein) : null,
      notes,
      meals,
    }

    const result = isEdit
      ? await supabase.from('meal_plans').update(payload).eq('id', planId)
      : await supabase.from('meal_plans').insert(payload).select().single()

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    navigate(`/patients/${patientId}/meal-plans/${isEdit ? planId : result.data.id}`)
  }

  if (loading) return <p style={styles.muted}>Loading...</p>

  return (
    <div>
      <h1 style={styles.heading}>{isEdit ? 'Edit Meal Plan' : 'New Meal Plan'}</h1>
      <p style={styles.subheading}>{patient?.full_name}</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Field label="Plan title *">
          <input style={styles.input} placeholder="e.g. Weight loss plan — Week 1"
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div style={styles.row}>
          <Field label="Date">
            <input style={styles.input} type="date" value={planDate}
              onChange={(e) => setPlanDate(e.target.value)} />
          </Field>
          <Field label="Diet type">
            <input style={styles.input} placeholder="e.g. Diabetic, Renal, General"
              value={dietType} onChange={(e) => setDietType(e.target.value)} />
          </Field>
        </div>

        <div style={styles.row}>
          <Field label="Target kcal/day">
            <input style={styles.input} type="number" value={targetKcal}
              onChange={(e) => setTargetKcal(e.target.value)} />
          </Field>
          <Field label="Target protein (g/day)">
            <input style={styles.input} type="number" value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value)} />
          </Field>
        </div>

        <div style={styles.totalsBox}>
          <div>
            <strong>{totals.kcal}</strong> kcal
            {targetKcal && <span style={styles.targetNote}> / {targetKcal} target</span>}
          </div>
          <div>
            <strong>{totals.protein_g}g</strong> protein
            {targetProtein && <span style={styles.targetNote}> / {targetProtein}g target</span>}
          </div>
          <div>{totals.carbs_g}g carbs</div>
          <div>{totals.fat_g}g fat</div>
        </div>

        {meals.map((meal, mealIndex) => (
          <div key={mealIndex} style={styles.mealSection}>
            <div style={styles.mealHeader}>
              <p style={styles.mealName}>{meal.name}</p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" style={styles.addFoodBtn} onClick={() => openSearch(mealIndex)}>
                  <Search size={14} style={{ marginRight: '0.3rem', verticalAlign: '-2px' }} />
                  Add food
                </button>
                <button type="button" style={styles.removeMealBtn} onClick={() => removeMealSection(mealIndex)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {meal.items.length === 0 ? (
              <p style={styles.emptyMeal}>No items added.</p>
            ) : (
              meal.items.map((item, itemIndex) => {
                const scaled = scaleFoodNutrients(item, item.quantity || 1)
                return (
                  <div key={itemIndex} style={styles.foodItem}>
                    <div style={{ flex: 1 }}>
                      <p style={styles.foodName}>{item.food_name}</p>
                      <p style={styles.foodMeta}>
                        {item.measure} · {scaled.kcal} kcal · {scaled.protein_g}g protein
                      </p>
                    </div>
                    <input
                      style={styles.qtyInput}
                      type="number"
                      step="0.5"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(mealIndex, itemIndex, e.target.value)}
                    />
                    <button
                      type="button"
                      style={styles.removeItemBtn}
                      onClick={() => removeItem(mealIndex, itemIndex)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        ))}

        <button type="button" style={styles.addMealBtn} onClick={addMealSection}>
          <Plus size={16} style={{ marginRight: '0.3rem', verticalAlign: '-3px' }} />
          Add meal section
        </button>

        <Field label="Notes">
          <textarea style={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.saveBtn} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Meal Plan'}
        </button>
      </form>

      {searchingMealIndex !== null && (
        <div style={styles.modalOverlay} onClick={closeSearch}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <p style={styles.modalTitle}>Add food to {meals[searchingMealIndex]?.name}</p>
              <button style={styles.closeBtn} onClick={closeSearch}>
                <X size={20} />
              </button>
            </div>
            <input
              style={styles.searchInput}
              placeholder="Search foods (e.g. nsima, beans, chicken)..."
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              autoFocus
            />
            <div style={styles.resultsList}>
              {searching ? (
                <p style={styles.muted}>Searching...</p>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p style={styles.muted}>No foods found.</p>
              ) : (
                searchResults.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    style={styles.resultItem}
                    onClick={() => addFoodToMeal(food)}
                  >
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={styles.resultName}>{food.food_name}</p>
                      <p style={styles.resultMeta}>
                        {food.measure} · {food.kcal} kcal · {food.protein_g}g protein
                      </p>
                    </div>
                    <Plus size={18} color="#4ade80" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
  heading: { fontSize: '1.3rem', color: '#fff', margin: 0 },
  subheading: { color: '#94a3b8', fontSize: '0.9rem', margin: '0.2rem 0 1rem' },
  muted: { color: '#64748b', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  row: { display: 'flex', gap: '0.6rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  label: { color: '#94a3b8', fontSize: '0.8rem' },
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
  totalsBox: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
    background: '#16a34a1a', border: '1px solid #16a34a44', borderRadius: '8px',
    padding: '0.75rem 0.9rem', color: '#e2e8f0', fontSize: '0.85rem',
  },
  targetNote: { color: '#94a3b8', fontSize: '0.75rem' },
  mealSection: { background: '#1e293b', borderRadius: '10px', padding: '0.75rem' },
  mealHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  mealName: { margin: 0, color: '#4ade80', fontWeight: 600, fontSize: '0.9rem' },
  addFoodBtn: {
    background: '#16a34a22', border: 'none', color: '#4ade80', borderRadius: '6px',
    padding: '0.4rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  removeMealBtn: {
    background: '#7f1d1d22', border: 'none', color: '#f87171', borderRadius: '6px',
    padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  emptyMeal: { color: '#64748b', fontSize: '0.8rem', margin: '0.3rem 0' },
  foodItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0',
    borderTop: '1px solid #334155',
  },
  foodName: { margin: 0, color: '#fff', fontSize: '0.85rem' },
  foodMeta: { margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.75rem' },
  qtyInput: {
    width: '55px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #334155',
    background: '#0f172a', color: '#fff', fontSize: '0.8rem', textAlign: 'center', outline: 'none',
  },
  removeItemBtn: {
    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem',
  },
  addMealBtn: {
    background: '#1e293b', border: '1px dashed #334155', color: '#94a3b8',
    borderRadius: '8px', padding: '0.6rem', fontSize: '0.85rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  error: { color: '#f87171', fontSize: '0.85rem' },
  saveBtn: {
    background: '#16a34a', color: '#fff', border: 'none', padding: '0.8rem',
    borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', zIndex: 50,
  },
  modal: {
    background: '#1e293b', borderRadius: '16px 16px 0 0', width: '100%',
    maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1rem',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  modalTitle: { color: '#fff', fontWeight: 600, fontSize: '1rem', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  searchInput: {
    padding: '0.7rem', borderRadius: '8px', border: '1px solid #334155',
    background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem',
  },
  resultsList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  resultItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0f172a', border: 'none', borderRadius: '8px', padding: '0.65rem 0.8rem', cursor: 'pointer',
  },
  resultName: { margin: 0, color: '#fff', fontSize: '0.85rem' },
  resultMeta: { margin: '0.15rem 0 0', color: '#94a3b8', fontSize: '0.75rem' },
}
