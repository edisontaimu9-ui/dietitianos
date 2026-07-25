import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAbXHmOX426QqMeeXVyVtd7qWrcZW3S5TY',
  authDomain: 'dietitianos.firebaseapp.com',
  projectId: 'dietitianos',
  storageBucket: 'dietitianos.firebasestorage.app',
  messagingSenderId: '490616951681',
  appId: '1:490616951681:web:b4f24b56ac2925198c0e80',
  measurementId: 'G-5V3BKHY4CB',
}

// Avoid re-initializing during HMR
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics only works in a real browser context, and Vite/HMR can call
// this module multiple times, so guard it with isSupported().
export let analytics = null
isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app)
  })
  .catch(() => {})

export default app
