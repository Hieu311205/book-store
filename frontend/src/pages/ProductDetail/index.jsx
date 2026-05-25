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
import { ProductDetailSkeleton } from '../../components/common/Loading'
import ProductGrid from '../../components/product/ProductGrid'
import ReviewSection from '../../components/review/ReviewSection'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [activeImg, setActiveImg] = useState(null) // null = dùng ảnh chính mặc định

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

  if (isLoading) return <ProductDetailSkeleton />

  if (!product) {
    return (
      <div className="store-empty-state store-not-found py-16">
        <div>
          <h1>404</h1>
          <p className="text-lg mb-4">Không tìm thấy sách này</p>
          <Link to="/products" className="btn btn-primary">
            Xem tất cả sách
          </Link>
        </div>
      </div>
    )
  }

  const defaultImage = product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    '/images/placeholder-book.jpg'

  const displayImage = activeImg || defaultImage

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
        {/* Gallery với thumbnail clickable */}
        <div className="store-detail-gallery">
          <div className="store-detail-main-image store-detail-zoom-wrap">
            <img
              src={displayImage}
              alt={product.title}
              key={displayImage}
              className="store-detail-zoom-img"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="store-detail-thumbs">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  className={`store-detail-thumb${(activeImg || defaultImage) === img.image_url ? ' is-active' : ''}`}
                  onClick={() => setActiveImg(img.image_url)}
                  aria-label={`Ảnh ${index + 1}`}
                >
                  <img src={img.image_url} alt="" />
                </button>
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
                <FaStar key={star} className={star <= Math.round(product.rating_avg) ? 'is-filled' : ''} />
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
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
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
            <button
              onClick={handleWishlist}
              disabled={wishlistMutation.isPending}
              className="store-detail-secondary-button"
            >
              <FiHeart />
              Yêu thích
            </button>
            <button onClick={handleShare} className="store-detail-secondary-button">
              <FiShare2 />
              Chia sẻ
            </button>
          </div>

          {product.short_description && (
            <p className="store-detail-description">{product.short_description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl">
        <div className="border-b dark:border-gray-700">
          <nav className="flex gap-8 px-6">
            {[
              { id: 'description', label: 'Mô tả' },
              { id: 'specs', label: 'Thông tin chi tiết' },
              { id: 'reviews', label: `Đánh giá${product.rating_count > 0 ? ` (${formatNumber(product.rating_count)})` : ''}` },
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
                {[
                  product.isbn && ['ISBN', product.isbn],
                  product.pages && ['Số trang', formatNumber(product.pages)],
                  product.publish_year && ['Năm xuất bản', product.publish_year],
                  product.translator && ['Dịch giả', product.translator],
                  product.language && ['Ngôn ngữ', product.language],
                  product.format && ['Định dạng',
                    product.format === 'hardcover' ? 'Bìa cứng' :
                    product.format === 'paperback' ? 'Bìa mềm' : 'Sách điện tử'],
                ].filter(Boolean).map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-3 text-gray-500 w-40">{label}</td>
                    <td className="py-3">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'reviews' && <ReviewSection productId={product.id} />}
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
