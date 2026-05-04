import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/Products/ProductForm'
import Categories from './pages/Categories'
import Orders from './pages/Orders'
import Users from './pages/Users'
import Coupons from './pages/Coupons'
import Sliders from './pages/Sliders'
import Settings from './pages/Settings'
import ContactMessages from './pages/ContactMessages'
import { useAuth } from './context/AuthContext'

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin } = useAuth()

  if (!isSuperAdmin) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-bold">Khong co quyen truy cap</h1>
        <p className="text-gray-500 mt-2">Chi super admin moi duoc su dung chuc nang nay.</p>
      </div>
    )
  }

  return children
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<Orders />} />
        <Route path="users" element={<SuperAdminRoute><Users /></SuperAdminRoute>} />
        <Route path="coupons" element={<SuperAdminRoute><Coupons /></SuperAdminRoute>} />
        <Route path="sliders" element={<SuperAdminRoute><Sliders /></SuperAdminRoute>} />
        <Route path="settings" element={<SuperAdminRoute><Settings /></SuperAdminRoute>} />
        <Route path="contact-messages" element={<SuperAdminRoute><ContactMessages /></SuperAdminRoute>} />
      </Route>
    </Routes>
  )
}

export default App
