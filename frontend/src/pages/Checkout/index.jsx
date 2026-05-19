import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/user.service'
import { orderService } from '../../services/order.service'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatPrice'
import { clearBuyNowItem, getBuyNowItem } from '../../utils/buyNowStorage'
import CouponList from '../../components/checkout/CouponList'

const paymentMethodText = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  wallet: 'Ví điện tử',
}

const Checkout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
  const [shippingMethod, setShippingMethod] = useState('giao_hang_tiet_kiem')
  const [customerNote, setCustomerNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedBankId, setSelectedBankId] = useState('')

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

  const shippingFees = {
    giao_hang_tiet_kiem: 25000,
    ghn: 30000,
    viettel_post: 35000,
    shop_delivery: 20000,
  }
  const shippingCost = shippingFees[shippingMethod] || 25000
  const payableTotal = Math.max(0, checkoutSummary.total + shippingCost - couponDiscount)

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    select: (res) => res.data,
  })
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: userService.getWallet,
    select: (res) => res.data,
  })
  const walletBalance = Number(walletData?.wallet?.balance || 0)
  const bankAccounts = walletData?.bank_accounts || []
  const selectedBank = bankAccounts.find((item) => String(item.id) === String(selectedBankId)) || bankAccounts[0]
  const hasLinkedBank = bankAccounts.length > 0

  useEffect(() => {
    if (!selectedBankId && bankAccounts.length) {
      setSelectedBankId(String(bankAccounts[0].id))
    }
  }, [bankAccounts, selectedBankId])

  const createMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async (response) => {
      const newOrder = response?.data
      if (isBuyNow) {
        clearBuyNowItem()
      } else {
        await clearCart(false)
      }
      await queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet'] })
      navigate('/order-success', { state: { order: newOrder } })
    },
    onError: (error) => toast.error(error.message || 'Không thể tạo đơn hàng'),
  })

  const submit = () => {
    if (!addressId) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    if (['bank_transfer', 'card'].includes(paymentMethod) && !selectedBank) {
      toast.error('Chọn tài khoản ngân hàng trước khi dùng phương thức thanh toán này')
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < payableTotal) {
      toast.error('Số dư ví không đủ để thanh toán')
      return
    }
    createMutation.mutate({
      address_id: Number(addressId),
      shipping_method: shippingMethod,
      payment_method: paymentMethod,
      bank_account_id: selectedBank ? Number(selectedBank.id) : undefined,
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
            <option value="giao_hang_tiet_kiem">Giao hàng tiết kiệm - 25.000 đ</option>
            <option value="ghn">GHN - 30.000 đ</option>
            <option value="viettel_post">Viettel Post - 35.000 đ</option>
            <option value="shop_delivery">Shop tự giao - 20.000 đ</option>
          </select>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Phương thức thanh toán</h3>
            {!hasLinkedBank && (
              <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                Liên kết ngân hàng ở mục Ví điện tử trước khi thanh toán bằng chuyển khoản hoặc thẻ.
              </div>
            )}
            {hasLinkedBank && (
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-500 mb-1 block">Tài khoản ngân hàng dùng cho thanh toán</label>
                <select className="input w-full max-w-xl" value={selectedBankId} onChange={(event) => setSelectedBankId(event.target.value)}>
                  {bankAccounts.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bank_name} - {bank.bank_account_name} - {bank.bank_account_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                <input type="radio" name="payment_method" value="cod" checked={paymentMethod === 'cod'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                  <p className="text-sm text-gray-500">Thanh toán tiền mặt hoặc qua ví điện tử cho người giao hàng.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 ${hasLinkedBank ? 'cursor-pointer' : 'opacity-60'}`}>
                <input type="radio" name="payment_method" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} disabled={!hasLinkedBank} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Chuyển khoản ngân hàng</span>
                  <p className="text-sm text-gray-500">
                    {selectedBank
                      ? `Thanh toán qua ${selectedBank.bank_name} - ${selectedBank.bank_account_number}.`
                      : 'Cần liên kết ngân hàng trước khi sử dụng.'}
                  </p>
                </div>
              </label>
              <label className={`flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 ${hasLinkedBank ? 'cursor-pointer' : 'opacity-60'}`}>
                <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} disabled={!hasLinkedBank} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Thẻ tín dụng / Thẻ ngân hàng</span>
                  <p className="text-sm text-gray-500">
                    {selectedBank ? `Thanh toán bằng thẻ/ngân hàng ${selectedBank.bank_name}.` : 'Cần liên kết ngân hàng trước khi sử dụng.'}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                <input type="radio" name="payment_method" value="wallet" checked={paymentMethod === 'wallet'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                <div>
                  <span className="font-medium">Ví điện tử Book Store</span>
                  <p className="text-sm text-gray-500">Số dư hiện có: {formatPrice(walletBalance)} đ</p>
                  {walletBalance < payableTotal && (
                    <p className="text-sm text-red-500">Số dư chưa đủ cho đơn hàng này.</p>
                  )}
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
          <div className="flex justify-between"><span>Phương thức thanh toán</span><span>{paymentMethodText[paymentMethod] || paymentMethod}</span></div>
          {['bank_transfer', 'card'].includes(paymentMethod) && selectedBank && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Ngân hàng</span>
              <span>{selectedBank.bank_name}</span>
            </div>
          )}
          {paymentMethod === 'wallet' && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Số dư ví sau thanh toán</span>
              <span>{formatPrice(Math.max(0, walletBalance - payableTotal))}</span>
            </div>
          )}
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
