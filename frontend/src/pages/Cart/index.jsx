import { Link } from 'react-router-dom'
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/formatPrice'

const Cart = () => {
  const { items, summary, updateQuantity, removeFromCart, clearCart } = useCart()
  const { isAuthenticated } = useAuth()

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Giỏ hàng đang trống</h1>
        <p className="text-gray-500 mb-6">Hãy chọn sách và thêm vào giỏ hàng.</p>
        <Link to="/products" className="btn btn-primary">
          Xem sách
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl"
            >
              <img
                src={item.image_url || '/images/placeholder-book.jpg'}
                alt={item.title}
                className="w-24 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <Link
                  to={`/product/${item.slug}`}
                  className="font-medium hover:text-primary-600"
                >
                  {item.title}
                </Link>
                {item.author_name && (
                  <p className="text-sm text-gray-500 mt-1">{item.author_name}</p>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border dark:border-gray-700 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  <div className="text-left">
                    <p className="text-primary-600 font-bold">{formatPrice(item.line_total)}</p>
                    {item.compare_price && item.compare_price > item.price && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(item.compare_price * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="flex items-center gap-1 text-red-500 text-sm mt-3 hover:text-red-600"
                >
                  <FiTrash2 size={14} />
                  Xóa
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm">
              Xóa giỏ hàng
            </button>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
              Tiếp tục mua sách
              <FiArrowLeft />
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sticky top-24">
            <h2 className="font-bold mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-sm border-b dark:border-gray-700 pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Số lượng</span>
                <span>{summary.item_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>- {formatPrice(summary.discount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Tổng cộng</span>
              <span className="text-primary-600">{formatPrice(summary.total)}</span>
            </div>

            {/* Coupon */}
            <div className="mb-6">
              <label className="text-sm text-gray-500 mb-2 block">Mã giảm giá</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã"
                  className="input flex-1"
                />
                <button className="btn btn-secondary">Áp dụng</button>
              </div>
            </div>

            {isAuthenticated ? (
              <Link to="/checkout" className="btn btn-primary w-full py-3">
                Tiến hành thanh toán
              </Link>
            ) : (
              <div className="space-y-3">
                <Link to="/login?redirect=/checkout" className="btn btn-primary w-full py-3">
                  Đăng nhập để thanh toán
                </Link>
                <p className="text-center text-sm text-gray-500">
                  Vui lòng đăng nhập để tiếp tục
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
