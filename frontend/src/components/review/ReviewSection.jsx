import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaStar } from 'react-icons/fa'
import { FiThumbsUp, FiCheckCircle, FiEdit3 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { reviewService } from '../../services/review.service'
import { useAuth } from '../../context/AuthContext'

// ─── Star selector dùng cho form ────────────────────────────────────────────
function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt']
  const active = hovered || value
  return (
    <div className="rv-star-selector">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          className={s <= active ? 'filled' : ''}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        />
      ))}
      {active > 0 && <span className="rv-star-label">{labels[active]}</span>}
    </div>
  )
}

// ─── Thanh progress rating kiểu Shopee ──────────────────────────────────────
function RatingSummary({ summary }) {
  const { avg, count, by_star } = summary
  const fullStars = Math.floor(avg)
  const hasHalf   = (avg - fullStars) >= 0.5

  return (
    <div className="rv-summary">
      <div className="rv-summary-left">
        <div className="rv-summary-score">{avg.toFixed(1)}</div>
        <div className="rv-summary-stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <FaStar key={s}
              className={s <= fullStars ? 'filled' : (s === fullStars + 1 && hasHalf ? 'half' : '')} />
          ))}
        </div>
        <div className="rv-summary-count">{count.toLocaleString('vi-VN')} đánh giá</div>
      </div>

      <div className="rv-summary-bars">
        {[5, 4, 3, 2, 1].map((s) => {
          const c   = by_star[s] || 0
          const pct = count > 0 ? (c / count) * 100 : 0
          return (
            <div key={s} className="rv-bar-row">
              <span className="rv-bar-label">{s} <FaStar /></span>
              <div className="rv-bar-track">
                <div className="rv-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="rv-bar-count">{c}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Form gửi đánh giá ───────────────────────────────────────────────────────
function ReviewForm({ productId, onSuccess }) {
  const queryClient = useQueryClient()
  const [rating,  setRating]  = useState(0)
  const [title,   setTitle]   = useState('')
  const [comment, setComment] = useState('')
  const [pros,    setPros]    = useState('')
  const [cons,    setCons]    = useState('')

  const mutation = useMutation({
    mutationFn: () => reviewService.submitReview({ product_id: productId, rating, title, comment, pros, cons }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId])
      queryClient.invalidateQueries(['product'])
      toast.success('Cảm ơn bạn đã đánh giá!')
      onSuccess?.()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể gửi đánh giá'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Vui lòng chọn số sao'); return }
    if (comment.trim().length < 10) { toast.error('Nhận xét phải có ít nhất 10 ký tự'); return }
    mutation.mutate()
  }

  return (
    <form className="rv-form" onSubmit={handleSubmit}>
      <h3 className="rv-form-title"><FiEdit3 /> Viết đánh giá của bạn</h3>

      <div className="rv-form-field">
        <label>Đánh giá *</label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <div className="rv-form-field">
        <label>Tiêu đề nhận xét</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tóm tắt ngắn gọn về sản phẩm..."
          maxLength={100}
        />
      </div>

      <div className="rv-form-field">
        <label>Nội dung đánh giá *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về cuốn sách này..."
          rows={4}
          minLength={10}
        />
        <span className="rv-char-count">{comment.length} ký tự</span>
      </div>

      <div className="rv-form-row">
        <div className="rv-form-field">
          <label>Điểm tốt</label>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="Những điểm bạn thích..."
            rows={2}
          />
        </div>
        <div className="rv-form-field">
          <label>Điểm chưa tốt</label>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="Những điểm có thể cải thiện..."
            rows={2}
          />
        </div>
      </div>

      <button type="submit" className="rv-submit-btn" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  )
}

// ─── Thẻ 1 đánh giá ─────────────────────────────────────────────────────────
function ReviewItem({ review }) {
  const [helped, setHelped] = useState(Boolean(Number(review.has_helped)))
  const [helpCount, setHelpCount] = useState(review.helpful_count || 0)

  const helpMutation = useMutation({
    mutationFn: () => reviewService.markHelpful(review.id),
    onSuccess: (res) => {
      const data = res?.data || res || {}
      setHelped(Boolean(data.helped))
      setHelpCount(Number(data.helpful_count ?? helpCount))
    },
    onError: (err) => toast.error(err.message || 'Không thể cập nhật hữu ích'),
  })

  const date = new Date(review.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <div className="rv-item">
      <div className="rv-item-header">
        <div className="rv-avatar">{(review.display_name || 'A')[0].toUpperCase()}</div>
        <div className="rv-item-meta">
          <span className="rv-item-name">{review.display_name || 'Người dùng ẩn danh'}</span>
          <div className="rv-item-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <FaStar key={s} className={s <= review.rating ? 'filled' : ''} />
            ))}
          </div>
        </div>
        <span className="rv-item-date">{date}</span>
      </div>

      {review.is_verified_purchase === 1 && (
        <div className="rv-verified"><FiCheckCircle /> Đã mua hàng</div>
      )}

      {review.title && <p className="rv-item-title">{review.title}</p>}
      <p className="rv-item-comment">{review.comment}</p>

      {(review.pros || review.cons) && (
        <div className="rv-pros-cons">
          {review.pros && (
            <div className="rv-pros">
              <span>👍 Điểm tốt:</span> {review.pros}
            </div>
          )}
          {review.cons && (
            <div className="rv-cons">
              <span>👎 Chưa tốt:</span> {review.cons}
            </div>
          )}
        </div>
      )}

      <button
        className={`rv-helpful-btn ${helped ? 'helped' : ''}`}
        onClick={() => helpMutation.mutate()}
        disabled={helpMutation.isPending}
      >
        <FiThumbsUp /> Hữu ích ({helpCount})
      </button>
    </div>
  )
}

// ─── Section chính ───────────────────────────────────────────────────────────
const ReviewSection = ({ productId }) => {
  const { isAuthenticated } = useAuth()
  const [filterStar, setFilterStar] = useState(0)
  const [sort, setSort]             = useState('newest')
  const [page, setPage]             = useState(1)
  const [showForm, setShowForm]     = useState(false)

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviews', productId, { filterStar, sort, page }],
    queryFn: () => reviewService.getProductReviews(productId, {
      page, limit: 8, rating: filterStar || undefined, sort,
    }),
    select: (res) => res.data,
    staleTime: 30_000,
  })

  const { data: canData } = useQuery({
    queryKey: ['reviews-can', productId],
    queryFn: () => reviewService.checkCanReview(productId),
    select: (res) => res.data,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const summary  = reviewData?.summary
  const reviews  = reviewData?.reviews || []
  const pagination = reviewData?.pagination

  const changeFilter = (star) => { setFilterStar(star); setPage(1) }
  const changeSort   = (s)    => { setSort(s); setPage(1) }

  return (
    <div className="rv-section">
      {/* Tổng hợp rating */}
      {summary && summary.count > 0 && (
        <RatingSummary summary={summary} />
      )}

      {/* Filter & Sort */}
      <div className="rv-toolbar">
        <div className="rv-filter-stars">
          <button className={filterStar === 0 ? 'active' : ''} onClick={() => changeFilter(0)}>
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              className={filterStar === s ? 'active' : ''}
              onClick={() => changeFilter(s)}
            >
              {s} <FaStar />
              {summary?.by_star?.[s] > 0 && (
                <span className="rv-filter-badge">{summary.by_star[s]}</span>
              )}
            </button>
          ))}
        </div>

        <select className="rv-sort-select" value={sort} onChange={(e) => changeSort(e.target.value)}>
          <option value="newest">Mới nhất</option>
          <option value="helpful">Hữu ích nhất</option>
          <option value="rating_high">Sao cao nhất</option>
          <option value="rating_low">Sao thấp nhất</option>
        </select>
      </div>

      {/* Nút viết đánh giá */}
      {isAuthenticated && canData?.can_review && !showForm && (
        <button className="rv-write-btn" onClick={() => setShowForm(true)}>
          <FiEdit3 /> Viết đánh giá của bạn
        </button>
      )}
      {isAuthenticated && canData?.already_reviewed && (
        <div className="rv-already-reviewed">Bạn đã đánh giá sản phẩm này.</div>
      )}

      {/* Form đánh giá */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Danh sách đánh giá */}
      {isLoading && <div className="rv-loading">Đang tải đánh giá...</div>}

      {!isLoading && reviews.length === 0 && (
        <div className="rv-empty">
          {filterStar > 0 ? `Chưa có đánh giá ${filterStar} sao.` : 'Chưa có đánh giá nào. Hãy là người đầu tiên!'}
        </div>
      )}

      <div className="rv-list">
        {reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
      </div>

      {/* Phân trang */}
      {pagination && pagination.totalPages > 1 && (
        <div className="rv-pagination">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewSection
