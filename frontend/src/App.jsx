import { Routes, Route } from 'react-router-dom'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import MiniCart from './components/common/MiniCart'
import StoreBreadcrumb from './components/common/StoreBreadcrumb'
import ScrollToTop from './components/common/ScrollToTop'
import BackToTop from './components/common/BackToTop'
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
import Wallet from './pages/Profile/Wallet'
import Search from './pages/Search'
import OrderSuccess from './pages/OrderSuccess'
import Contact from './pages/Contact'
import FAQ from './pages/FAQ'
import Returns from './pages/Returns'
import Shipping from './pages/Shipping'

const App = () => {
  return (
    <div className="store-app min-h-screen flex flex-col">
      <ScrollToTop />
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
          <Route path="/returns" element={<Returns />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />}>
            <Route index element={<ProfileDashboard />} />
            <Route path="orders" element={<ProfileOrders />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="store-404-page">
                <div className="store-404-content">
                  <div className="store-404-number">404</div>
                  <h1 className="store-404-title">Trang không tồn tại</h1>
                  <p className="store-404-desc">Trang bạn đang tìm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.</p>
                  <div className="store-404-actions">
                    <a href="/" className="btn btn-primary">Về trang chủ</a>
                    <a href="/products" className="btn btn-outline">Xem tất cả sách</a>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <MiniCart />
      <BackToTop />
    </div>
  )
}

export default App
