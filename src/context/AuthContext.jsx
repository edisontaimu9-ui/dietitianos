import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext()

const FRIENDLY_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/requires-recent-login': 'Please sign out and sign in again before changing your password.',
}

function friendlyError(error) {
  const code = error?.code || ''
  return { code, message: FRIENDLY_ERRORS[code] || error?.message || 'Something went wrong.' }
}

async function loadDietitianProfile(uid) {
  const snap = await getDoc(doc(db, 'dietitian_profiles', uid))
  return snap.exists() ? snap.data() : null
}

function mapUser(fbUser, profile) {
  if (!fbUser) return null
  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    email: fbUser.email,
    user_metadata: {
      full_name: profile?.full_name ?? fbUser.displayName ?? '',
      practice_name: profile?.practice_name ?? '',
      practice_phone: profile?.practice_phone ?? '',
      practice_address: profile?.practice_address ?? '',
    },
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await loadDietitianProfile(fbUser.uid).catch(() => null)
        setUser(mapUser(fbUser, profile))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function signUp(email, password, fullName) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await firebaseUpdateProfile(cred.user, { displayName: fullName })
      await setDoc(doc(db, 'dietitian_profiles', cred.user.uid), {
        full_name: fullName,
        practice_name: '',
        practice_phone: '',
        practice_address: '',
        created_at: serverTimestamp(),
      })
      await sendEmailVerification(cred.user)
      return { error: null }
    } catch (error) {
      return { error: friendlyError(error) }
    }
  }

  async function signIn(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error: friendlyError(error) }
    }
  }

  const signOut = () => firebaseSignOut(auth)

  async function updatePassword(newPassword) {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated')
      await firebaseUpdatePassword(auth.currentUser, newPassword)
      return { error: null }
    } catch (error) {
      return { error: friendlyError(error) }
    }
  }

  async function updateProfile(metadata) {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated')

      if (metadata.full_name !== undefined) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: metadata.full_name })
      }

      await setDoc(doc(db, 'dietitian_profiles', auth.currentUser.uid), metadata, { merge: true })

      const profile = await loadDietitianProfile(auth.currentUser.uid)
      setUser(mapUser(auth.currentUser, profile))

      return { error: null }
    } catch (error) {
      return { error: friendlyError(error) }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signOut, updatePassword, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
