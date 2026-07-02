// Nutrition calculation helpers

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

export function bmiCategory(bmi) {
  if (bmi == null) return ''
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

// Mifflin-St Jeor equation for BMR, then apply activity factor for TEE
export function calculateEnergyNeeds({ weightKg, heightCm, age, sex, activityFactor = 1.2 }) {
  if (!weightKg || !heightCm || !age || !sex) return null

  let bmr
  if (sex === 'Male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  }

  const tee = bmr * activityFactor
  return Math.round(tee)
}

// Standard protein estimate: 0.8-1.2 g/kg for healthy adults (using 1.0 g/kg as default)
export function calculateProteinNeeds(weightKg, gPerKg = 1.0) {
  if (!weightKg) return null
  return Math.round(weightKg * gPerKg * 10) / 10
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  return Math.floor((Date.now() - new Date(dateOfBirth)) / 31557600000)
}

export const ACTIVITY_FACTORS = [
  { value: 1.2, label: 'Sedentary (little/no exercise)' },
  { value: 1.375, label: 'Lightly active (1-3 days/week)' },
  { value: 1.55, label: 'Moderately active (3-5 days/week)' },
  { value: 1.725, label: 'Very active (6-7 days/week)' },
  { value: 1.9, label: 'Extremely active (physical job/2x training)' },
]
