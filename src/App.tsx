import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Prescription from './pages/Prescriptions'
import ProtectedRoute from './components/ProtectedRoute'
import Patients from './pages/Patients'
import Labs from './pages/Labs'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/prescription" 
          element={
            <ProtectedRoute>
              <Prescription />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patients" 
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/labs" 
          element={
            <ProtectedRoute>
              <Labs />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
