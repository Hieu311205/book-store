import { Link } from 'react-router-dom'
import { FiShoppingCart, FiHeart } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { formatPrice } from '../../utils/formatPrice'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/user.service'

const ProductCard = ({ product }) => {
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

  const handleWishlist = (event) => {
    event.preventDefault()
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để thêm yêu thích')
      return
    }
    wishlistMutation.mutate(product.id)
  }

  return (
    <div className="card group overflow-hidden">
      <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Giảm {product.discount_percent}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded-lg font-medium">Hết hàng</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault()
              if (product.stock > 0) addToCart(product.id)
            }}
            disabled={product.stock === 0}
            className="flex-1 btn btn-primary text-sm py-2 disabled:opacity-50"
          >
            <FiShoppingCart size={16} />
            <span className="hidden sm:inline">Thêm</span>
          </button>
          <button
            onClick={handleWishlist}
            disabled={wishlistMutation.isPending}
            className="btn btn-secondary p-2 disabled:opacity-50"
          >
            <FiHeart size={16} />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary-600 transition-colors min-h-[40px]">
            {product.title}
          </h3>
        </Link>

        {product.author_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.author_name}</p>
        )}

        {product.rating_avg > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <FaStar className="text-yellow-400" size={12} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {product.rating_avg} ({product.rating_count})
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className="text-primary-600 font-bold">{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-gray-400 text-sm line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
