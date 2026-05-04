import { Link } from 'react-router-dom'
import { FiX, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatPrice'

const MiniCart = () => {
  const { items, summary, isOpen, closeCart, updateQuantity, removeFromCart } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />

      <div className="absolute left-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-bold">Giỏ hàng ({summary.item_count})</h2>
            <button onClick={closeCart} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <FiX size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Giỏ hàng đang trống</p>
                <Link to="/products" onClick={closeCart} className="text-primary-600 hover:underline mt-2 inline-block">
                  Xem sách
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <img
                      src={item.image_url || '/images/placeholder-book.jpg'}
                      alt={item.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="font-medium text-sm hover:text-primary-600 line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{item.author_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary-600 font-bold text-sm">
                          {formatPrice(item.price)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          >
                            <FiPlus size={14} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded mr-2"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t dark:border-gray-700 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span>- {formatPrice(summary.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary-600">{formatPrice(summary.total)}</span>
              </div>
              <Link
                to="/cart"
                onClick={closeCart}
                className="btn btn-primary w-full"
              >
                Xem giỏ hàng và thanh toán
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MiniCart
