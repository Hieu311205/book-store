import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/user.service'
import { orderService } from '../../services/order.service'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatPrice'
import { clearBuyNowItem, getBuyNowItem } from '../../utils/buyNowStorage'
import CouponList from '../../components/checkout/CouponList'

const Checkout = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { items, summary, clearCart } = useCart()
  const [buyNowItem] = useState(() => (searchParams.get('mode') === 'buy-now' ? getBuyNowItem() : null))
  const selectedIds = useMemo(
    () => (searchParams.get('selected') || '')
      .split(',')
      .map((id) => Number(id))
      .filter(Boolean),
    [searchParams],
  )
  const [addressId, setAddressId] = useState('')
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [customerNote, setCustomerNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [selectedCoupon, setSelectedCoupon] = useState(null)

  const isBuyNow = Boolean(buyNowItem)
  const checkoutItems = isBuyNow
    ? [buyNowItem]
    : selectedIds.length
      ? items.filter((item) => selectedIds.includes(item.product_id))
      : items
  const checkoutSummary = isBuyNow
    ? {
        subtotal: buyNowItem.line_total,
        discount: 0,
        total: buyNowItem.line_total,
        item_count: buyNowItem.quantity,
      }
    : selectedIds.length
      ? checkoutItems.reduce(
          (result, item) => {
            result.subtotal += item.line_total
            result.total += item.line_total
            result.item_count += item.quantity
            return result
          },
          { subtotal: 0, discount: 0, total: 0, item_count: 0 },
        )
      : summary

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0
    if (Number(checkoutSummary.subtotal) < Number(selectedCoupon.min_purchase || 0)) return 0

    const rawDiscount = selectedCoupon.type === 'percentage'
      ? Math.floor(Number(checkoutSummary.subtotal) * (Number(selectedCoupon.value) / 100))
      : Number(selectedCoupon.value)
    const maxDiscount = Number(selectedCoupon.max_discount || 0)
    return maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount
  }, [checkoutSummary.subtotal, selectedCoupon])

  const shippingCost = shippingMethod === 'express' ? 50000 : 25000
  const payableTotal = Math.max(0, checkoutSummary.total + shippingCost - couponDiscount)

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async () => {
      if (isBuyNow) {
        clearBuyNowItem()
      } else {
        await clearCart()
      }
      toast.success('Đã tạo đơn hàng')
      navigate('/profile/orders')
    },
    onError: (error) => toast.error(error.message || 'Không thể tạo đơn hàng'),
  })

  const submit = () => {
    if (!addressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    createMutation.mutate({
      address_id: Number(addressId),
      shipping_method: shippingMethod,
      payment_method: paymentMethod,
      customer_note: customerNote,
      coupon_code: selectedCoupon?.code || undefined,
      items: isBuyNow
        ? [{ product_id: buyNowItem.product_id, quantity: buyNowItem.quantity }]
        : selectedIds.length
          ? checkoutItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
          : undefined,
      clear_selected_cart_items: !isBuyNow && selectedIds.length > 0,
    })
  }

  if (!checkoutItems.length) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Giỏ hàng đang trống</h1>
        <Link to="/products" className="btn btn-primary">Xem sách</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-4">Thanh toán</h1>
          <h2 className="font-semibold mb-3">Địa chỉ giao hàng</h2>
          {addresses?.length ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label key={address.id} className="flex gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={String(addressId) === String(address.id)}
                    onChange={(event) => setAddressId(event.target.value)}
                  />
                  <span>
                    <span className="font-medium block">{address.full_name} - {address.phone}</span>
                    <span className="text-sm text-gray-500">{address.address}, {address.city}, {address.province}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">
              Bạn chưa có địa chỉ. <Link className="text-primary-600" to="/profile/addresses">Thêm địa chỉ</Link>
            </div>
          )}
        </div>

        <CouponList selectedCode={selectedCoupon?.code} onSelect={setSelectedCoupon} />

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Vận chuyển</h2>
          <select className="input max-w-sm" value={shippingMethod} onChange={(event) => setShippingMethod(event.target.value)}>
            <option value="standard">Tiêu chuẩn - 25.000 đ</option>
            <option value="express">Nhanh - 50.000 đ</option>
          </select>
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                <input type="radio" name="payment_method" value="cod" checked={paymentMethod === 'cod'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                  <p className="text-sm text-gray-500">Thanh toán tiền mặt hoặc qua ví điện tử cho người giao hàng.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                <input type="radio" name="payment_method" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Chuyển khoản ngân hàng</span>
                  <p className="text-sm text-gray-500">Chuyển tiền vào tài khoản của shop sau khi đặt hàng.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Thẻ tín dụng / Thẻ ngân hàng</span>
                  <p className="text-sm text-gray-500">Thanh toán qua thẻ. Bạn sẽ nhận hướng dẫn tiếp theo sau khi đặt hàng.</p>
                </div>
              </label>
            </div>
          </div>
          <textarea
            className="input mt-4 min-h-24"
            placeholder="Ghi chú cho đơn hàng"
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
          />
        </div>
      </div>

      <aside className="bg-white dark:bg-gray-800 rounded-xl p-6 h-fit">
        <h2 className="font-bold mb-4">Tóm tắt</h2>
        <div className="space-y-2 text-sm mb-4">
          {checkoutItems.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span className="truncate">{item.title} x {item.quantity}</span>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between"><span>Tạm tính</span><span>{formatPrice(checkoutSummary.subtotal)}</span></div>
          <div className="flex justify-between"><span>Vận chuyển</span><span>{formatPrice(shippingCost)}</span></div>
          {selectedCoupon && (
            <div className="flex justify-between text-green-600">
              <span>Mã {selectedCoupon.code}</span>
              <span>- {formatPrice(couponDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between"><span>Phương thức thanh toán</span><span className="capitalize">{paymentMethod.replace('_', ' ')}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Tổng</span><span className="text-primary-600">{formatPrice(payableTotal)}</span></div>
        </div>
        <button onClick={submit} className="btn btn-primary w-full mt-6" disabled={createMutation.isPending}>
          Đặt hàng
        </button>
      </aside>
    </div>
  )
}

export default Checkout
