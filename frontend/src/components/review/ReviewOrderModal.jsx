import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaStar } from 'react-icons/fa'
import { FiEdit3, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { orderService } from '../../services/order.service'
import { reviewService } from '../../services/review.service'

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

function ProductReviewForm({ item, onDone }) {
  const queryClient = useQueryClient()
  const [rating,  setRating]  = useState(0)
  const [title,   setTitle]   = useState('')
  const [comment, setComment] = useState('')
  const [pros,    setPros]    = useState('')
  const [cons,    setCons]    = useState('')

  const mutation = useMutation({
    mutationFn: () => reviewService.submitReview({
      product_id: item.product_id,
      order_id: item.order_id,
      rating,
      title,
      comment,
      pros,
      cons,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', item.product_id])
      queryClient.invalidateQueries(['product'])
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['order-detail'] })
      toast.success(`Đã đánh giá "${item.product_title}"!`)
      onDone()
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
    <form className="rv-form" style={{ marginTop: '0.75rem' }} onSubmit={handleSubmit}>
      <div className="rv-form-field">
        <label>Số sao *</label>
        <StarSelector value={rating} onChange={setRating} />
      </div>
      <div className="rv-form-field">
        <label>Tiêu đề</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tóm tắt ngắn gọn..."
          maxLength={100}
        />
      </div>
      <div className="rv-form-field">
        <label>Nội dung đánh giá *</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về cuốn sách này..."
          rows={3}
        />
        <span className="rv-char-count">{comment.length} ký tự</span>
      </div>
      <div className="rv-form-row">
        <div className="rv-form-field">
          <label>Điểm tốt</label>
          <textarea
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="Điểm bạn thích..."
            rows={2}
          />
        </div>
        <div className="rv-form-field">
          <label>Chưa tốt</label>
          <textarea
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="Điểm có thể cải thiện..."
            rows={2}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" className="rv-submit-btn" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{
            padding: '0.7rem 1rem',
            border: '1.5px solid #e5e7eb',
            borderRadius: '0.6rem',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  )
}

const ReviewOrderModal = ({ orderId, onClose }) => {
  const [activeItemId, setActiveItemId] = useState(null)
  const [doneItems,    setDoneItems]    = useState(new Set())

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    select: (res) => res.data,
  })

  const handleDone = (itemId) => {
    setDoneItems((prev) => new Set([...prev, itemId]))
    setActiveItemId(null)
  }

  return (
    <div className="rv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rv-modal">
        <button className="rv-modal-close" onClick={onClose}>&times;</button>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
          Đánh giá sản phẩm — Đơn {order?.order_number || ''}
        </h3>

        {isLoading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Đang tải...</p>}

        {order?.items?.map((item) => {
          const isDone    = doneItems.has(item.id) || Boolean(Number(item.already_reviewed))
          const isActive  = activeItemId === item.id
          return (
            <div key={item.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div className="rv-modal-product">
                <img
                  src={item.product_image || '/images/placeholder-book.jpg'}
                  alt={item.product_title}
                  onError={(e) => { e.target.src = '/images/placeholder-book.jpg' }}
                />
                <div style={{ flex: 1 }}>
                  <p className="rv-modal-product-title">{item.product_title}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Số lượng: {item.quantity}</p>
                </div>
                {isDone ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>
                    <FiCheckCircle /> Đã đánh giá
                  </span>
                ) : (
                  <button
                    className="rv-write-btn"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                    onClick={() => setActiveItemId(isActive ? null : item.id)}
                  >
                    <FiEdit3 /> {isActive ? 'Đóng' : 'Đánh giá'}
                  </button>
                )}
              </div>

              {isActive && !isDone && (
                <ProductReviewForm
                  item={item}
                  onDone={() => handleDone(item.id)}
                />
              )}
            </div>
          )
        })}

        <button
          onClick={onClose}
          style={{
            marginTop: '0.5rem',
            padding: '0.6rem 1.5rem',
            border: '1.5px solid #e5e7eb',
            borderRadius: '0.6rem',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  )
}

export default ReviewOrderModal
