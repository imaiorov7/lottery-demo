import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Lotteries from './pages/Lotteries'
import LotteryEdit from './pages/LotteryEdit'
import Tickets from './pages/Tickets'
import Users from './pages/Users'
import Draw from './pages/Draw'
import Reports from './pages/Reports'
import WidgetPreview from './pages/WidgetPreview'
import Integrations from './pages/Integrations'
import IntegrationDocs from './pages/IntegrationDocs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lotteries" element={<Lotteries />} />
              <Route path="/lotteries/new" element={<LotteryEdit />} />
              <Route path="/lotteries/:id" element={<LotteryEdit />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/users" element={<Users />} />
              <Route path="/draw" element={<Draw />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/widget" element={<WidgetPreview />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/docs" element={<IntegrationDocs />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
