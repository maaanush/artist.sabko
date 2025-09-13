import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import RootRedirect from './pages/RootRedirect'
import RequestReceived from './pages/RequestReceived'
import CheckEmail from './pages/CheckEmail'
import OnboardingEmailSent from './pages/OnboardingEmailSent'
import OnboardingProfile from './pages/OnboardingProfile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/request-received" element={<RequestReceived />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/onboarding/1" element={<OnboardingEmailSent />} />
        <Route path="/onboarding/2" element={<OnboardingProfile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
