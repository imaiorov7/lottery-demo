import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import LotteryDetail from './pages/LotteryDetail'
import MyTickets from './pages/MyTickets'
import MyCoupons from './pages/MyCoupons'
import Widget from './pages/Widget'

export default function App() {
  return (
    <Routes>
      {/* Widget runs bare – no site chrome */}
      <Route path="/widget" element={<Widget />} />
      {/* All other routes inside main Layout */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/lottery/:id" element={<LotteryDetail />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/my-coupons" element={<MyCoupons />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

