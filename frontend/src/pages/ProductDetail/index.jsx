import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiChevronRight, FiHeart, FiMinus, FiPlus, FiShare2, FiShoppingCart } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { productService } from '../../services/product.service'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/user.service'
import { formatNumber, formatPrice } from '../../utils/formatPrice'
import { saveBuyNowItem } from '../../utils/buyNowStorage'
import { PageLoading } from '../../components/common/Loading'
import ProductGrid from '../../components/product/ProductGrid'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug),
    select: (res) => res.data,
  })

  const { data: relatedProducts } = useQuery({
    queryKey: ['products', 'related', product?.category_id],
    queryFn: () => productService.getProducts({ category: product.category_id, limit: 4 }),
    select: (res) => res.data?.products?.filter((item) => item.id !== product.id),
    enabled: !!product?.category_id,
  })

  const wishlistMutation = useMutation({
    mutationFn: userService.addToWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      queryClient.invalidateQueries(['profile-wishlist-count'])
      toast.success('Đã thêm vào yêu thích')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm vào yêu thích'),
  })

  if (isLoading) return <PageLoading />

  if (!product) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy sách</h1>
        <Link to="/products" className="text-primary-600 hover:underline">
          Quay lại danh sách sách
        </Link>
      </div>
    )
  }

  const mainImage = product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    '/images/placeholder-book.jpg'

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
  }

  const handleBuyNow = () => {
    saveBuyNowItem(product, quantity)
    navigate('/checkout?mode=buy-now')
  }

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập để thêm yêu thích')
      return
    }
    wishlistMutation.mutate(product.id)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.short_description || product.title,
          url: window.location.href,
        })
        return
      }
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép link sản phẩm')
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Không thể chia sẻ sản phẩm')
      }
    }
  }

  return (
    <div className="store-product-detail-page">
      <nav className="store-detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <FiChevronRight />
        <Link to="/products?sort=newest">SÁCH MỚI PHÁT HÀNH</Link>
        {product.category_name && (
          <>
            <FiChevronRight />
            <Link to={`/products?category=${product.category_id}`}>{product.category_name}</Link>
          </>
        )}
        <FiChevronRight />
        <span>{product.title}</span>
      </nav>

      <div className="store-detail-layout">
        <div className="store-detail-gallery">
          <div className="store-detail-main-image">
            <img src={mainImage} alt={product.title} />
          </div>
          {product.images?.length > 1 && (
            <div className="store-detail-thumbs">
              {product.images.map((img, index) => (
                <div key={index} className="store-detail-thumb">
                  <img src={img.image_url} alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="store-detail-info">
          <h1>{product.title}</h1>
          {product.title_en && <p className="store-detail-subtitle">{product.title_en}</p>}

          <div className="store-detail-rating-row">
            <div className="store-detail-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar key={star} className={star <= product.rating_avg ? 'is-filled' : ''} />
              ))}
            </div>
            <span>
              {product.rating_count > 0
                ? `(${formatNumber(product.rating_count)} đánh giá)`
                : '(Chưa có đánh giá)'}
            </span>
            <span className="store-detail-sold">Đã bán {formatNumber(product.sales_count || 0)}</span>
          </div>

          {product.author_name && (
            <p className="store-detail-author">
              <span>Tác giả:</span>
              <Link to={`/products?author=${product.author_id}`}>{product.author_name}</Link>
            </p>
          )}

          {product.publisher_name && (
            <p className="store-detail-meta">
              <span>Nhà xuất bản:</span>
              <strong>{product.publisher_name}</strong>
            </p>
          )}

          <div className="store-detail-price-row">
            <strong>{formatPrice(product.price)}</strong>
            {product.compare_price && product.compare_price > product.price && (
              <span>{formatPrice(product.compare_price)}</span>
            )}
            {product.discount_percent > 0 && <em>- {product.discount_percent}%</em>}
          </div>

          {product.stock > 0 ? (
            <div className="store-detail-quantity">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>
                <FiPlus />
              </button>
            </div>
          ) : (
            <span className="store-detail-soldout">Hết hàng</span>
          )}

          <div className="store-detail-actions">
            {product.stock > 0 && (
              <button onClick={handleAddToCart} className="store-detail-cart-button">
                Thêm vào giỏ hàng
                <FiShoppingCart />
              </button>
            )}
            {product.stock > 0 && (
              <button onClick={handleBuyNow} className="store-detail-buy-button">
                Mua ngay
              </button>
            )}
            <button onClick={handleWishlist} disabled={wishlistMutation.isPending} className="store-detail-secondary-button">
              <FiHeart />
              Yêu thích
            </button>
            <button onClick={handleShare} className="store-detail-secondary-button">
              <FiShare2 />
              Chia sẻ
            </button>
          </div>

          {product.short_description && <p className="store-detail-description">{product.short_description}</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl">
        <div className="border-b dark:border-gray-700">
          <nav className="flex gap-8 px-6">
            {[
              { id: 'description', label: 'Mô tả' },
              { id: 'specs', label: 'Thông tin chi tiết' },
              { id: 'reviews', label: 'Đánh giá' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="prose dark:prose-invert max-w-none">
              {product.description || 'Chưa có mô tả cho sách này.'}
            </div>
          )}

          {activeTab === 'specs' && (
            <table className="w-full max-w-2xl">
              <tbody className="divide-y dark:divide-gray-700">
                {product.isbn && (
                  <tr>
                    <td className="py-3 text-gray-500 w-40">ISBN</td>
                    <td className="py-3">{product.isbn}</td>
                  </tr>
                )}
                {product.pages && (
                  <tr>
                    <td className="py-3 text-gray-500">Số trang</td>
                    <td className="py-3">{formatNumber(product.pages)}</td>
                  </tr>
                )}
                {product.publish_year && (
                  <tr>
                    <td className="py-3 text-gray-500">Năm xuất bản</td>
                    <td className="py-3">{product.publish_year}</td>
                  </tr>
                )}
                {product.translator && (
                  <tr>
                    <td className="py-3 text-gray-500">Dịch giả</td>
                    <td className="py-3">{product.translator}</td>
                  </tr>
                )}
                {product.language && (
                  <tr>
                    <td className="py-3 text-gray-500">Ngôn ngữ</td>
                    <td className="py-3">{product.language}</td>
                  </tr>
                )}
                {product.format && (
                  <tr>
                    <td className="py-3 text-gray-500">Định dạng</td>
                    <td className="py-3">
                      {product.format === 'hardcover' ? 'Bìa cứng' :
                        product.format === 'paperback' ? 'Bìa mềm' : 'Sách điện tử'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-8 text-gray-500">
              Chưa có đánh giá.
            </div>
          )}
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6">Sách liên quan</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  )
}

export default ProductDetail
