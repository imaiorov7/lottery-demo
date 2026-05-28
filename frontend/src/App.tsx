import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import PosLayout from './components/pos/PosLayout'
import Hub from './pages/Hub'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import LotteryDetail from './pages/LotteryDetail'
import MyTickets from './pages/MyTickets'
import MyCoupons from './pages/MyCoupons'
import Widget from './pages/Widget'
import Layout from './components/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import Lotteries from './pages/admin/Lotteries'
import LotteryEdit from './pages/admin/LotteryEdit'
import AdminTickets from './pages/admin/Tickets'
import Users from './pages/admin/Users'
import Draw from './pages/admin/Draw'
import Reports from './pages/admin/Reports'
import WidgetPreview from './pages/admin/WidgetPreview'
import Integrations from './pages/admin/Integrations'
import IntegrationDocs from './pages/admin/IntegrationDocs'
import SellTicket from './pages/pos/SellTicket'
import ValidateTicket from './pages/pos/ValidateTicket'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/widget" element={<Widget />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<RequireAuth><Hub /></RequireAuth>} />

      <Route path="/player/*" element={
        <RequireAuth>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lottery/:id" element={<LotteryDetail />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/my-coupons" element={<MyCoupons />} />
            </Routes>
          </Layout>
        </RequireAuth>
      } />

      <Route path="/admin/*" element={
        <RequireAuth>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/lotteries" element={<Lotteries />} />
              <Route path="/lotteries/new" element={<LotteryEdit />} />
              <Route path="/lotteries/:id" element={<LotteryEdit />} />
              <Route path="/tickets" element={<AdminTickets />} />
              <Route path="/users" element={<Users />} />
              <Route path="/draw" element={<Draw />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/widget-preview" element={<WidgetPreview />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/docs" element={<IntegrationDocs />} />
            </Routes>
          </AdminLayout>
        </RequireAuth>
      } />

      <Route path="/pos/*" element={
        <RequireAuth>
          <PosLayout>
            <Routes>
              <Route path="/" element={<SellTicket />} />
              <Route path="/validate" element={<ValidateTicket />} />
            </Routes>
          </PosLayout>
        </RequireAuth>
      } />
    </Routes>
  )
}
