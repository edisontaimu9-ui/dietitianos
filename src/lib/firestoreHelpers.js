// Small helpers to keep Firestore read code terse and consistent
// across pages, since the Firestore SDK returns snapshots rather
// than plain objects the way Supabase did.

/** Turn a single DocumentSnapshot into a plain object (or null). */
export function docData(snap) {
  return snap && snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Turn a QuerySnapshot into an array of plain objects. */
export function collData(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Safely convert a Firestore Timestamp (or ISO string/Date) to a Date. */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}
