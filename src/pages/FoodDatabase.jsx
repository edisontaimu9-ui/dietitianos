import { useState } from 'react'
import { Search } from 'lucide-react'
import { searchFoods } from '../lib/chakudyaApi'

const CATEGORIES = [
  '', 'Cereals', 'Legumes', 'Vegetables', 'Fruits', 'Meat', 'Fish',
  'Dairy', 'Fats & Oils', 'Beverages', 'Other',
]

export default function FoodDatabase() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const results = await searchFoods(query, { category: category || undefined, limit: 30 })
      setFoods(results || [])
    } catch (err) {
      setError(err.message)
      setFoods([])
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={styles.heading}>Food Database</h1>
      <p style={styles.subheading}>Search Malawian foods via the Chakudya database</p>

      <form onSubmit={handleSearch} style={styles.searchRow}>
        <div style={styles.inputWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            style={styles.input}
            type="text"
            placeholder="Search foods (e.g. nsima, beans, groundnuts)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select style={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || 'All categories'}</option>
          ))}
        </select>
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {!loading && searched && foods.length === 0 && !error && (
        <p style={styles.muted}>No foods found. Try a different search term.</p>
      )}

      <div style={styles.grid}>
        {foods.map((food) => (
          <div key={food.id} style={styles.card}>
            <p style={styles.foodName}>{food.food_name}</p>
            <p style={styles.foodMeta}>
              {food.category} · {food.measure} ({food.weight_g}g)
            </p>
            <div style={styles.macros}>
              <Macro label="kcal" value={food.kcal} />
              <Macro label="Protein" value={`${food.protein_g}g`} />
              <Macro label="Carbs" value={`${food.carbs_g}g`} />
              <Macro label="Fat" value={`${food.fat_g}g`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Macro({ label, value }) {
  return (
    <div style={styles.macro}>
      <p style={styles.macroValue}>{value}</p>
      <p style={styles.macroLabel}>{label}</p>
    </div>
  )
}

const styles = {
  heading: {
    fontSize: '1.4rem',
    marginBottom: '0.25rem',
    color: 'var(--text-heading)',
  },
  subheading: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },
  searchRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  inputWrap: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-secondary)',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.75rem 0.65rem 2.1rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-heading)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    padding: '0.6rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
  },
  button: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--text-heading)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: 'var(--danger-text)',
    fontSize: '0.85rem',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '0.85rem 1rem',
  },
  foodName: {
    margin: 0,
    fontWeight: 600,
    color: 'var(--text-heading)',
    fontSize: '0.95rem',
  },
  foodMeta: {
    margin: '0.15rem 0 0.6rem',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
  macros: {
    display: 'flex',
    gap: '1rem',
  },
  macro: {
    textAlign: 'center',
  },
  macroValue: {
    margin: 0,
    fontWeight: 700,
    color: 'var(--success-text)',
    fontSize: '0.95rem',
  },
  macroLabel: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: '0.7rem',
  },
}
