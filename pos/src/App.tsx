import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import SellTicket from './pages/SellTicket'
import ValidateTicket from './pages/ValidateTicket'
import Layout from './components/Layout'

export default function App() {
  const token = localStorage.getItem('pos_token')
  if (!token) return <Login />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SellTicket />} />
        <Route path="/validate" element={<ValidateTicket />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
