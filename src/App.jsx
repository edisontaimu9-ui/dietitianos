import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import PatientForm from './pages/PatientForm'
import Appointments from './pages/Appointments'
import AppointmentForm from './pages/AppointmentForm'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/new" element={<PatientForm />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="patients/:id/edit" element={<PatientForm />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="appointments/new" element={<AppointmentForm />} />
            <Route path="appointments/:id/edit" element={<AppointmentForm />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
