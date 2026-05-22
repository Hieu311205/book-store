import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/formatPrice'

const Cart = () => {
  const { items, updateQuantity, removeFromCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    setSelectedIds((current) => {
      const availableIds = items.map((item) => item.product_id)
      return current.filter((id) => availableIds.includes(id))
    })
  }, [items])

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.product_id)),
    [items, selectedIds],
  )

  const totals = useMemo(() => {
    return selectedItems.reduce(
      (result, item) => {
        const originalPrice = item.compare_price && item.compare_price > item.price ? Number(item.compare_price) : Number(item.price)
        const originalLine = originalPrice * item.quantity
        const saleLine = Number(item.price) * item.quantity

        result.original += originalLine
        result.subtotal += saleLine
        result.saving += Math.max(0, originalLine - saleLine)
        result.count += item.quantity
        return result
      },
      { original: 0, subtotal: 0, saving: 0, count: 0 },
    )
  }, [selectedItems])

  const isAllSelected = items.length > 0 && selectedIds.length === items.length

  const toggleAll = () => {
    setSelectedIds(isAllSelected ? [] : items.map((item) => item.product_id))
  }

  const toggleItem = (productId) => {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )
  }

  const checkoutUrl = selectedItems.length
    ? `/checkout?selected=${selectedItems.map((item) => item.product_id).join(',')}`
    : '#'

  if (items.length === 0) {
    return (
      <div className="store-cart-empty">
        <h1>Giỏ hàng đang trống</h1>
        <p>Hãy chọn sách và thêm vào giỏ hàng.</p>
        <Link to="/products" className="btn btn-primary">
          Xem sách
        </Link>
      </div>
    )
  }

  return (
    <div className="store-cart-page">
      <section className="store-cart-list">
        <div className="store-cart-heading">
          <h1>Danh sách sản phẩm ({items.length})</h1>
        </div>

        {totals.saving > 0 && (
          <div className="store-cart-saving">
            <span>🎁</span>
            <strong>Đơn hàng của bạn được giảm thêm {formatPrice(totals.saving)}</strong>
          </div>
        )}

        <label className="store-cart-select-all">
          <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
          <span><FiCheck /></span>
          Chọn tất cả sản phẩm
        </label>

        <div className="store-cart-items">
          {items.map((item) => {
            const checked = selectedIds.includes(item.product_id)
            const originalLine = item.compare_price && item.compare_price > item.price
              ? item.compare_price * item.quantity
              : null

            return (
              <article className="store-cart-row" key={item.id}>
                <label className="store-cart-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(item.product_id)}
                  />
                  <span><FiCheck /></span>
                </label>

                <Link to={`/product/${item.slug}`} className="store-cart-cover">
                  <img src={item.image_url || '/images/placeholder-book.jpg'} alt={item.title} />
                </Link>

                <div className="store-cart-title">
                  <Link to={`/product/${item.slug}`}>{item.title}</Link>
                  {item.author_name && <small>{item.author_name}</small>}
                </div>

                <div className="store-cart-price">
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  {originalLine && <span>{formatPrice(originalLine)}</span>}
                </div>

                <div className="store-cart-quantity">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <FiMinus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                    <FiPlus size={14} />
                  </button>
                </div>

                <button className="store-cart-remove" onClick={() => removeFromCart(item.product_id)} title="Xóa sản phẩm">
                  <FiTrash2 />
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <aside className="store-cart-summary">
        <h2>Thanh toán</h2>
        <div className="store-cart-summary-card">
          <div className="store-cart-summary-line">
            <span>Tổng tiền:</span>
            <strong>{formatPrice(totals.original)}</strong>
          </div>
          <div className="store-cart-summary-line">
            <span>Tiết kiệm:</span>
            <strong>{formatPrice(totals.saving)}</strong>
          </div>
          {isAuthenticated ? (
            <Link
              to={checkoutUrl}
              className={`store-cart-checkout ${selectedItems.length ? '' : 'is-disabled'}`}
              onClick={(event) => {
                if (!selectedItems.length) event.preventDefault()
              }}
            >
              Thanh toán
            </Link>
          ) : (
            <Link to="/login?redirect=/cart" className="store-cart-checkout">
              Đăng nhập để thanh toán
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}

export default Cart
