import { useQuery } from '@tanstack/react-query'
import { cartService } from '../../services/cart.service'
import { formatPrice } from '../../utils/formatPrice'

export const getCouponDescription = (coupon) => {
  if (!coupon) return ''
  const value = coupon.type === 'percentage'
    ? `Giảm ${Number(coupon.value)}%`
    : `Giảm ${formatPrice(coupon.value)}`
  const minPurchase = Number(coupon.min_purchase) > 0 ? ` cho đơn từ ${formatPrice(coupon.min_purchase)}` : ''
  const maxDiscount = Number(coupon.max_discount) > 0 ? `, tối đa ${formatPrice(coupon.max_discount)}` : ''
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="font-semibold mb-3">Mã giảm giá</h2>
      <select
        id="coupon-select"
        className="input w-full"
        value={selectedCode || ''}
        onChange={(event) => {
          const coupon = coupons.find((item) => item.code === event.target.value) || null
          onSelect?.(coupon)
        }}
      >
        <option value="">-- Chọn mã giảm giá --</option>
        {coupons.map((coupon) => (
          <option key={coupon.id} value={coupon.code}>
            {coupon.code} — {getCouponDescription(coupon)}
          </option>
        ))}
      </select>

      {selectedCoupon && (
        <div className="mt-3 flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm">
          <div>
            <span className="font-semibold text-green-700 dark:text-green-400">{selectedCoupon.code}</span>
            <span className="ml-2 text-green-600 dark:text-green-500">{getCouponDescription(selectedCoupon)}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelect?.(null)}
            className="text-gray-400 hover:text-red-500 ml-4 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default CouponList