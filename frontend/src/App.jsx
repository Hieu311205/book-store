import { Routes, Route } from 'react-router-dom'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import MiniCart from './components/common/MiniCart'
import StoreBreadcrumb from './components/common/StoreBreadcrumb'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Profile, { ProfileDashboard } from './pages/Profile'
import ProfileOrders from './pages/Profile/Orders'
import Wishlist from './pages/Profile/Wishlist'
import Addresses from './pages/Profile/Addresses'
import Settings from './pages/Profile/Settings'
import Search from './pages/Search'
import OrderSuccess from './pages/OrderSuccess'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'

const App = () => {
  return (
    <div className="store-app min-h-screen flex flex-col">
      <Header />
      <main className="store-page-main flex-1 container mx-auto px-4 py-6">
        <StoreBreadcrumb />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/search" element={<Search />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />}>
            <Route index element={<ProfileDashboard />} />
            <Route path="orders" element={<ProfileOrders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="store-empty-state store-not-found">
                <h1>404</h1>
                <p>Không tìm thấy trang</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <MiniCart />
    </div>
  )
}

export default App
