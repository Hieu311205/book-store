import { useQuery } from '@tanstack/react-query'
import { cartService } from '../../services/cart.service'
import { formatPrice } from '../../utils/formatPrice'

export const getCouponDescription = (coupon) => {
  if (!coupon) return ''
  const value = coupon.type === 'percentage'
    ? `Giảm ${Number(coupon.value)}%`
    : `Giảm ${formatPrice(coupon.value)}`
  const minPurchase = Number(coupon.min_purchase) > 0 ? ` cho đơn hàng từ ${formatPrice(coupon.min_purchase)}` : ''
  const maxDiscount = Number(coupon.max_discount) > 0 ? ` giảm tối đa ${formatPrice(coupon.max_discount)}` : ''
  return `${value}${minPurchase}${maxDiscount}`
}

const CouponList = ({ selectedCode, onSelect }) => {
  const { data: coupons = [] } = useQuery({
    queryKey: ['public-coupons'],
    queryFn: cartService.getCoupons,
    select: (res) => res.data || [],
  })

  if (!coupons.length) return null

  const selectedCoupon = coupons.find((coupon) => coupon.code === selectedCode) || null

  return (
    <section className="store-checkout-coupons">
      <label htmlFor="coupon-select">Mã giảm giá</label>
      <select
        id="coupon-select"
        className="store-coupon-select"
        value={selectedCode || ''}
        onChange={(event) => {
          const coupon = coupons.find((item) => item.code === event.target.value) || null
          onSelect?.(coupon)
        }}
      >
        <option value="">Chọn mã giảm giá</option>
        {coupons.map((coupon) => (
          <option key={coupon.id} value={coupon.code}>
            {coupon.code} - {getCouponDescription(coupon)}
          </option>
        ))}
      </select>

      {selectedCoupon && (
        <div className="store-selected-coupon">
          <span>{selectedCoupon.code}</span>
          <strong>{getCouponDescription(selectedCoupon)}</strong>
        </div>
      )}
    </section>
  )
}

export default CouponList
