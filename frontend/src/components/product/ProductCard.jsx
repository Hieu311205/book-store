import { Link, useNavigate } from 'react-router-dom'
import { FiHeart, FiShoppingBag, FiShoppingCart } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { formatPrice } from '../../utils/formatPrice'
import { saveBuyNowItem } from '../../utils/buyNowStorage'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/user.service'

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const imageUrl = product.images?.[0]?.image_url || product.primary_image || '/images/placeholder-book.jpg'

  const wishlistMutation = useMutation({
    mutationFn: userService.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      queryClient.invalidateQueries(['profile-wishlist-count'])
      toast.success('Đã thêm vào yêu thích')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm vào yêu thích'),
  })

  const canBuy = product.stock > 0

  const handleAddToCart = () => {
    if (!canBuy) return
    addToCart(product.id)
  }

  const handleBuyNow = () => {
    if (!canBuy) return
    saveBuyNowItem(product)
    navigate('/checkout?mode=buy-now')
  }

  const handleWishlist = (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để thêm yêu thích')
      return
    }
    wishlistMutation.mutate(product.id)
  }

  return (
    <article className="store-book-card group">
      <Link to={`/product/${product.slug}`} className="store-book-cover">
        <img src={imageUrl} alt={product.title} loading="lazy" />
        {product.discount_percent > 0 && <span className="store-sale-badge">-{product.discount_percent}%</span>}
        {product.stock === 0 && <span className="store-soldout">Hết hàng</span>}
      </Link>

      <div className="store-book-info">
        <Link to={`/product/${product.slug}`} className="store-book-title">
          {product.title}
        </Link>

        {product.author_name && <p className="store-book-author">{product.author_name}</p>}

        {product.rating_avg > 0 && (
          <div className="store-rating">
            <FaStar size={12} />
            <span>{product.rating_avg} ({product.rating_count})</span>
          </div>
        )}

        <div className="store-price-row">
          <span className="store-price">{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="store-compare-price">{formatPrice(product.compare_price)}</span>
          )}
        </div>

        <div className="store-book-actions">
          <button onClick={handleAddToCart} disabled={!canBuy} className="store-cart-button" title="Thêm vào giỏ hàng">
            <FiShoppingCart size={16} />
            <span>Thêm vào giỏ hàng</span>
          </button>
          <button
            onClick={handleWishlist}
            disabled={wishlistMutation.isPending}
            className="store-heart-button"
            title="Yêu thích"
          >
            <FiHeart size={16} />
          </button>
          <button onClick={handleBuyNow} disabled={!canBuy} className="store-buy-button">
            <FiShoppingBag size={15} />
            Mua ngay
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
