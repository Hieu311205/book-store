import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShare2,
  FiShoppingCart,
  FiTag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import { productService } from '../../services/product.service'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/user.service'
import { cartService } from '../../services/cart.service'
import { formatNumber, formatPrice } from '../../utils/formatPrice'
import { saveBuyNowItem } from '../../utils/buyNowStorage'
import { ProductDetailSkeleton } from '../../components/common/Loading'
import ProductGrid from '../../components/product/ProductGrid'
import ReviewSection from '../../components/review/ReviewSection'
import { getCouponDescription } from '../../components/checkout/CouponList'

const formatBookFormat = (format) => {
  if (format === 'hardcover') return 'Bìa cứng'
  if (format === 'paperback') return 'Bìa mềm'
  if (format === 'ebook') return 'Sách điện tử'
  return '-'
}

const valueOrDash = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return value
}

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState('')
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

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

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    select: (res) => {
      const payload = res?.data ?? res
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.addresses)) return payload.addresses
      return []
    },
    enabled: isAuthenticated,
  })

  const { data: coupons = [] } = useQuery({
    queryKey: ['public-coupons'],
    queryFn: cartService.getCoupons,
    select: (res) => {
      const payload = res?.data ?? res
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.coupons)) return payload.coupons
      return []
    },
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

  const galleryImages = useMemo(() => {
    if (!product) return []
    const coverImages = product.images?.length
      ? product.images.map((img) => img.image_url)
      : [product.image_url || '/images/placeholder-book.jpg']
    const previewImages = (product.preview_images || []).map((img) => img.image_url)
    return [...new Set([...coverImages, ...previewImages].filter(Boolean))]
  }, [product])

  useEffect(() => {
    if (galleryImages.length) {
      setSelectedImage(galleryImages[0])
    }
  }, [galleryImages])

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

  const detailRows = [
    ['SKU', product.sku],
    ['ISBN', product.isbn],
    ['Danh mục', product.category_name],
    ['Tác giả', product.author_name],
    ['Nhà xuất bản', product.publisher_name],
    ['Số trang', product.pages ? formatNumber(product.pages) : ''],
    ['Năm xuất bản', product.publish_year],
    ['Ngôn ngữ', product.language],
    ['Người dịch', product.translator],
    ['Phiên bản', product.edition],
    ['Hình thức bìa', product.format ? formatBookFormat(product.format) : ''],
    ['Trọng lượng (gr)', product.weight ? formatNumber(product.weight) : ''],
  ].filter(([, value]) => valueOrDash(value) !== '-')

  const defaultAddress = addresses.find((address) => address.is_default) || addresses[0]
  const comparePrice = Number(product.compare_price || 0)
  const price = Number(product.price || 0)
  const discountPercent = Number(product.discount_percent || 0)
    || (comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0)
  const activeCoupons = coupons.slice(0, 4)
  const visibleThumbs = galleryImages.length > 4 ? galleryImages.slice(0, 3) : galleryImages
  const hiddenThumbs = galleryImages.length > 4 ? galleryImages.slice(3) : []
  const selectedImageIndex = Math.max(0, galleryImages.indexOf(selectedImage))
  const showGalleryArrows = galleryImages.length > 1
  const goToGalleryImage = (direction) => {
    if (!galleryImages.length) return
    const nextIndex = (selectedImageIndex + direction + galleryImages.length) % galleryImages.length
    setSelectedImage(galleryImages[nextIndex])
  }

  return (
    <div className="store-product-detail-page">
      <nav className="store-detail-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <FiChevronRight />
        <Link to="/products?sort=newest">Sách mới phát hành</Link>
        {product.category_name && (
          <>
            <FiChevronRight />
            <Link to={`/products?category=${product.category_id}`}>{product.category_name}</Link>
          </>
        )}
        <FiChevronRight />
        <span>{product.title}</span>
      </nav>

      <div className="store-detail-shell">
        <aside className="store-detail-purchase-card">
          <button type="button" className="store-detail-main-image" onClick={() => setIsGalleryOpen(true)} title="Xem anh lon">
            <img src={selectedImage || '/images/placeholder-book.jpg'} alt={product.title} />
            {showGalleryArrows && (
              <>
                <span
                  role="button"
                  tabIndex={0}
                  className="store-detail-gallery-arrow is-prev"
                  onClick={(event) => {
                    event.stopPropagation()
                    goToGalleryImage(-1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.stopPropagation()
                      goToGalleryImage(-1)
                    }
                  }}
                  aria-label="Anh truoc"
                >
                  <FiChevronLeft />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="store-detail-gallery-arrow is-next"
                  onClick={(event) => {
                    event.stopPropagation()
                    goToGalleryImage(1)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.stopPropagation()
                      goToGalleryImage(1)
                    }
                  }}
                  aria-label="Anh tiep theo"
                >
                  <FiChevronRight />
                </span>
              </>
            )}
          </button>

          {galleryImages.length > 1 && (
            <div className="store-detail-thumbs">
              {visibleThumbs.map((image) => (
                <button
                  type="button"
                  key={image}
                  className={`store-detail-thumb ${selectedImage === image ? 'is-active' : ''}`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={product.title} />
                </button>
              ))}
              {hiddenThumbs.length > 0 && (
                <button
                  type="button"
                  className="store-detail-thumb store-detail-thumb-more"
                  onClick={() => setSelectedImage(hiddenThumbs[0])}
                >
                  <img src={hiddenThumbs[0]} alt={product.title} />
                  <span>+{hiddenThumbs.length}</span>
                </button>
              )}
            </div>
          )}

          <div className="store-detail-actions">
            {product.stock > 0 && (
              <button type="button" onClick={handleAddToCart} className="store-detail-cart-button">
                <FiShoppingCart />
                Thêm vào giỏ hàng
              </button>
            )}
            {product.stock > 0 && (
              <button type="button" onClick={handleBuyNow} className="store-detail-buy-button">
                Đặt trước
              </button>
            )}
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistMutation.isPending}
              className="store-detail-secondary-button"
            >
              <FiHeart />
              Yêu thích
            </button>
            <button type="button" onClick={handleShare} className="store-detail-secondary-button">
              <FiShare2 />
              Chia sẻ
            </button>
          </div>

          <div className="store-detail-policy">
            <h3>Chính sách ưu đãi của Book Store</h3>
            <p>
              <FiTruck />
              <span><strong>Thời gian giao hàng:</strong> Giao nhanh và uy tín</span>
            </p>
            <p>
              <FiRefreshCw />
              <span><strong>Chính sách đổi trả:</strong> Đổi trả theo quy định của shop</span>
            </p>
            <p>
              <FiUsers />
              <span><strong>Chính sách khách sỉ:</strong> Ưu đãi khi mua số lượng lớn</span>
            </p>
          </div>
        </aside>

        <section className="store-detail-content">
          <article className="store-detail-card store-detail-sale-card">
            <h1>
              <span>Mới</span>
              {product.title}
            </h1>
            {product.title_en && <p>{product.title_en}</p>}

            <div className="store-detail-top-meta">
              <p>Danh mục: <strong>{product.category_name || '-'}</strong></p>
              <p>Tác giả: <strong>{product.author_name || '-'}</strong></p>
              <p>Nhà xuất bản: <strong>{product.publisher_name || '-'}</strong></p>
              <p>Hình thức bìa: <strong>{formatBookFormat(product.format)}</strong></p>
            </div>

            <div className="store-detail-rating-line">
              <span>★★★★★</span>
              <strong>({formatNumber(product.rating_count || 0)} đánh giá)</strong>
            </div>

            <div className="store-detail-price-row">
              <strong>{formatPrice(product.price)} đ</strong>
              {comparePrice > price && <span>{formatPrice(comparePrice)} đ</span>}
              {discountPercent > 0 && <em>-{discountPercent}%</em>}
            </div>

            <Link className="store-detail-promo-link" to="/products?sort=bestseller">
              Chính sách khuyến mãi trên chỉ áp dụng tại Book Store
              <FiChevronRight />
            </Link>

            <div className="store-detail-arrival-note">
              {product.stock > 0 ? `Sản phẩm có sẵn - còn ${formatNumber(product.stock)} sản phẩm` : 'Sản phẩm sắp có hàng'}
            </div>
          </article>

          <article className="store-detail-card store-detail-shipping-card">
            <h2>Thông tin vận chuyển</h2>
            <p className="store-detail-address-line">
              <FiMapPin />
              {defaultAddress ? (
                <>
                  Giao hàng đến <strong>{defaultAddress.address}, {defaultAddress.city}, {defaultAddress.province}</strong>
                  <Link to="/profile/addresses">Thay đổi</Link>
                </>
              ) : (
                <>
                  Chưa chọn địa chỉ giao hàng
                  <Link to={isAuthenticated ? '/profile/addresses' : '/login'}>Thêm địa chỉ</Link>
                </>
              )}
            </p>

            <div className="store-detail-coupon-heading">
              <strong>Ưu đãi liên quan</strong>
              <Link to="/checkout">Xem thêm <FiChevronRight /></Link>
            </div>

            {activeCoupons.length > 0 && (
              <div className="store-detail-coupon-list">
                {activeCoupons.map((coupon) => (
                  <div className="store-detail-coupon-pill" key={coupon.id || coupon.code}>
                    <FiTag />
                    <span>{coupon.code} - {getCouponDescription(coupon)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="store-detail-quantity-row">
              <strong>Số lượng:</strong>
              {product.stock > 0 ? (
                <div className="store-detail-quantity">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <FiMinus />
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <FiPlus />
                  </button>
                </div>
              ) : (
                <span className="store-detail-soldout">Hết hàng</span>
              )}
            </div>
          </article>

          <article className="store-detail-card">
            <h2>Thông tin chi tiết</h2>
            <div className="store-detail-specs">
              {detailRows.map(([label, value]) => (
                <div className="store-detail-spec-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="store-detail-card store-detail-description-card">
            <h2>Mô tả sản phẩm</h2>
            <h3>{product.title}</h3>
            <div className="store-detail-description">
              {product.description || product.short_description || 'Chưa có mô tả cho sách này.'}
            </div>
          </article>

          <article className="store-detail-card">
            <ReviewSection productId={product.id} />
          </article>
        </section>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="store-detail-related">
          <h2>Sách liên quan</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}

      {isGalleryOpen && (
        <div className="store-gallery-viewer" role="dialog" aria-modal="true">
          <button type="button" className="store-gallery-close" onClick={() => setIsGalleryOpen(false)}>
            Dong
          </button>

          {showGalleryArrows && (
            <>
              <button type="button" className="store-gallery-nav is-prev" onClick={() => goToGalleryImage(-1)} aria-label="Anh truoc">
                <FiChevronLeft />
              </button>
              <button type="button" className="store-gallery-nav is-next" onClick={() => goToGalleryImage(1)} aria-label="Anh tiep theo">
                <FiChevronRight />
              </button>
            </>
          )}

          <div className="store-gallery-stage" onClick={() => setIsGalleryOpen(false)}>
            <img src={selectedImage || '/images/placeholder-book.jpg'} alt={product.title} onClick={(event) => event.stopPropagation()} />
            <div className="store-gallery-caption">{product.title}</div>
          </div>

          <div className="store-gallery-strip">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={image}
                className={`store-gallery-strip-item ${selectedImage === image ? 'is-active' : ''}`}
                onClick={() => setSelectedImage(image)}
              >
                <img src={image} alt={`${product.title} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default ProductDetail
