const BASE_URL = 'https://chakudya-api.edisontaimu9.workers.dev'

// Search foods by name. Returns array of food objects:
// { id, food_name, category, measure, weight_g, kcal, kj, protein_g, carbs_g, fat_g }
export async function searchFoods(query, { category, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (category) params.set('category', category)
  params.set('limit', limit)

  const res = await fetch(`${BASE_URL}/foods?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to search foods')
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'Food search failed')
  return json.data
}

export async function getFoodById(id) {
  const res = await fetch(`${BASE_URL}/foods/${id}`)
  if (!res.ok) throw new Error('Failed to fetch food')
  const json = await res.json()
  if (json.status !== 'success') throw new Error(json.message || 'Food lookup failed')
  return json.data
}

// Scale a food's nutrients by a quantity multiplier (e.g. 1.5x the base measure)
export function scaleFoodNutrients(food, quantity = 1) {
  return {
    kcal: Math.round(food.kcal * quantity),
    protein_g: Math.round(food.protein_g * quantity * 10) / 10,
    carbs_g: Math.round(food.carbs_g * quantity * 10) / 10,
    fat_g: Math.round(food.fat_g * quantity * 10) / 10,
    weight_g: Math.round(food.weight_g * quantity),
  }
}

export function sumMealNutrients(meals) {
  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const meal of meals) {
    for (const item of meal.items || []) {
      const scaled = scaleFoodNutrients(item, item.quantity || 1)
      totals.kcal += scaled.kcal
      totals.protein_g += scaled.protein_g
      totals.carbs_g += scaled.carbs_g
      totals.fat_g += scaled.fat_g
    }
  }
  totals.protein_g = Math.round(totals.protein_g * 10) / 10
  totals.carbs_g = Math.round(totals.carbs_g * 10) / 10
  totals.fat_g = Math.round(totals.fat_g * 10) / 10
  return totals
}
