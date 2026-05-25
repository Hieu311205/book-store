/**
 * Checkout — Trang thanh toán
 *
 * LUỒNG OTP (chỉ với bank_transfer / card):
 *
 *   [1] Người dùng chọn sản phẩm → vào trang Checkout
 *   [2] Chọn địa chỉ, vận chuyển, phương thức "Chuyển khoản ngân hàng"
 *   [3] Nhấn nút "Đặt hàng & nhận OTP"
 *        └─ submit() gọi orderService.sendOtp()
 *              └─ POST /api/v1/otp/send  → backend tạo mã, gửi Gmail, trả về { email_sent, dev_otp }
 *   [4] Frontend mở <OtpModal> — người dùng nhập mã 6 số từ Gmail
 *   [5] Nhấn "Xác nhận & Đặt hàng"
 *        └─ handleOtpVerify(code) gọi createMutation với payload kèm otp_code
 *              └─ POST /api/v1/orders  → backend xác minh OTP rồi tạo đơn hàng
 *   [6] Thành công → điều hướng đến /order-success
 *
 * LUỒNG KHÔNG CÓ OTP (COD / wallet):
 *   [3] Nhấn "Đặt hàng" → submit() gọi createMutation trực tiếp (bỏ qua toàn bộ bước OTP)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/user.service'
import { orderService } from '../../services/order.service'
import { settingsService } from '../../services/settings.service'
import { useAuth } from '../../context/AuthContext'
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

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 4: OTP Modal — hiển thị sau khi backend gửi email thành công
// ═══════════════════════════════════════════════════════════════════════════════
const OtpModal = ({ email, devOtp, onVerify, onClose }) => {
  const [code, setCode]         = useState('')       // chuỗi 6 chữ số đang nhập
  const [seconds, setSeconds]   = useState(300)      // đếm ngược 5 phút (đồng hồ phía client)
  const [cooldown, setCooldown] = useState(60)       // chờ 60s trước khi cho phép gửi lại
  const [sending, setSending]   = useState(false)    // đang gọi API gửi lại
  const inputsRef               = useRef([])         // ref mảng 6 ô input để điều hướng focus

  // Đếm ngược thời gian hiệu lực — reset về 0 khi hết, không âm
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // Đếm ngược cooldown gửi lại — chỉ chạy khi cooldown > 0
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // Định dạng giây → MM:SS để hiển thị đồng hồ
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Xử lý nhập từng ký tự vào ô — chỉ chấp nhận chữ số, tự nhảy sang ô tiếp theo
  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return          // lọc ký tự không phải số
    const chars = code.split('')
    chars[i] = val
    const next = chars.join('').slice(0, 6)
    setCode(next)
    if (val && i < 5) inputsRef.current[i + 1]?.focus()  // tự chuyển sang ô kế
  }

  // Backspace trên ô trống → lùi về ô trước
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputsRef.current[i - 1]?.focus()
  }

  // Dán (Ctrl+V / paste) — lọc số, điền vào 6 ô, đặt focus vào ô cuối đã điền
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text) {
      setCode(text)
      inputsRef.current[Math.min(text.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  // Gửi lại OTP: gọi lại POST /api/v1/otp/send → backend xóa mã cũ, tạo mã mới, gửi email
  const resend = useCallback(async () => {
    if (cooldown > 0 || sending) return
    setSending(true)
    try {
      const res = await orderService.sendOtp()
      toast.success('Đã gửi lại mã OTP')
      setSeconds(300)    // reset đồng hồ 5 phút
      setCooldown(60)    // khóa nút gửi lại 60s
      setCode('')        // xóa mã cũ đang nhập
      // Nếu email chưa cấu hình → dev_otp trả về trong response để test
      if (res.data?.dev_otp) toast(`Dev OTP: ${res.data.dev_otp}`, { icon: '🔑' })
    } catch (err) {
      toast.error(err.message || 'Không thể gửi lại OTP')
    } finally {
      setSending(false)
    }
  }, [cooldown, sending])

  return (
    // Click ra ngoài modal → đóng
    <div className="otp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="otp-modal">
        <button className="otp-close" onClick={onClose} aria-label="Đóng">×</button>

        <div className="otp-icon">📧</div>
        <h2 className="otp-title">Xác nhận thanh toán</h2>
        <p className="otp-desc">
          Mã OTP gồm 6 chữ số đã được gửi đến<br />
          <strong>{email}</strong>
        </p>

        {/* Hiển thị khi email chưa được cấu hình (môi trường dev) */}
        {devOtp && (
          <div className="otp-dev-hint">
            ⚠️ Server chưa cấu hình email — mã OTP thử nghiệm: <strong>{devOtp}</strong>
          </div>
        )}

        {/* 6 ô nhập số — điều hướng bàn phím và paste được hỗ trợ */}
        <div className="otp-inputs" onPaste={handlePaste}>
          {Array.from({ length: 6 }, (_, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[i] || ''}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`otp-cell ${code[i] ? 'filled' : ''}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Đồng hồ đếm ngược — chỉ phía client, không đồng bộ với server */}
        <div className="otp-timer">
          {seconds > 0 ? (
            <span>Mã hết hạn sau <strong>{fmt(seconds)}</strong></span>
          ) : (
            <span className="expired">Mã đã hết hạn</span>
          )}
        </div>

        {/* BƯỚC 5: Xác nhận → gọi handleOtpVerify(code) ở Checkout */}
        <button
          className="otp-submit"
          disabled={code.length < 6 || seconds === 0}  // cần đủ 6 số và còn trong hạn
          onClick={() => onVerify(code)}
        >
          Xác nhận & Đặt hàng
        </button>

        {/* Gửi lại mã — disabled 60s sau mỗi lần gửi */}
        <button
          className="otp-resend"
          onClick={resend}
          disabled={cooldown > 0 || sending}
        >
          {sending ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 1-2: Checkout — form chọn địa chỉ, vận chuyển, phương thức thanh toán
// ═══════════════════════════════════════════════════════════════════════════════
const Checkout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()                         // lấy email người dùng để hiện trong modal
  const { items, summary, clearCart } = useCart()

  // Nếu URL có ?mode=buy-now → lấy sản phẩm từ localStorage thay vì giỏ hàng
  const [buyNowItem] = useState(() => (searchParams.get('mode') === 'buy-now' ? getBuyNowItem() : null))

  // Nếu URL có ?selected=1,2,3 → chỉ thanh toán các sản phẩm được chọn trong giỏ
  const selectedIds = useMemo(
    () => (searchParams.get('selected') || '')
      .split(',')
      .map((id) => Number(id))
      .filter(Boolean),
    [searchParams],
  )

  // ── State form ──────────────────────────────────────────────────────────────
  const [addressId, setAddressId]           = useState('')
  const [shippingMethod, setShippingMethod] = useState('giao_hang_tiet_kiem')
  const [customerNote, setCustomerNote]     = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('cod')
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedBankId, setSelectedBankId] = useState('')

  // OTP modal: null = ẩn, { email, devOtp } = hiện
  const [otpModal, setOtpModal] = useState(null)

  // ── Tính toán sản phẩm cần thanh toán ──────────────────────────────────────
  const isBuyNow = Boolean(buyNowItem)
  const checkoutItems = isBuyNow
    ? [buyNowItem]
    : selectedIds.length
      ? items.filter((item) => selectedIds.includes(item.product_id))
      : items

  const checkoutSummary = isBuyNow
    ? { subtotal: buyNowItem.line_total, discount: 0, total: buyNowItem.line_total, item_count: buyNowItem.quantity }
    : selectedIds.length
      ? checkoutItems.reduce(
          (result, item) => {
            result.subtotal += item.line_total
            result.total    += item.line_total
            result.item_count += item.quantity
            return result
          },
          { subtotal: 0, discount: 0, total: 0, item_count: 0 },
        )
      : summary

  // Tính giảm giá từ coupon (theo % hoặc cố định, có max_discount)
  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0
    if (Number(checkoutSummary.subtotal) < Number(selectedCoupon.min_purchase || 0)) return 0
    const rawDiscount = selectedCoupon.type === 'percentage'
      ? Math.floor(Number(checkoutSummary.subtotal) * (Number(selectedCoupon.value) / 100))
      : Number(selectedCoupon.value)
    const maxDiscount = Number(selectedCoupon.max_discount || 0)
    return maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount
  }, [checkoutSummary.subtotal, selectedCoupon])

  const shippingFees = { giao_hang_tiet_kiem: 25000, ghn: 30000, viettel_post: 35000, shop_delivery: 20000 }
  const shippingCost = shippingFees[shippingMethod] || 25000
  const payableTotal = Math.max(0, checkoutSummary.total + shippingCost - couponDiscount)

  // ── Data fetching ───────────────────────────────────────────────────────────
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
  const { data: shopSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data,
    staleTime: 60000,
  })

  const walletBalance = Number(walletData?.wallet?.balance || 0)
  const bankAccounts  = walletData?.bank_accounts || []
  const selectedBank  = bankAccounts.find((item) => String(item.id) === String(selectedBankId)) || bankAccounts[0]
  const hasLinkedBank = bankAccounts.length > 0

  // Tự chọn ngân hàng đầu tiên khi dữ liệu load xong
  useEffect(() => {
    if (!selectedBankId && bankAccounts.length) setSelectedBankId(String(bankAccounts[0].id))
  }, [bankAccounts, selectedBankId])

  // ── BƯỚC 6 → mutation tạo đơn hàng ─────────────────────────────────────────
  // Được gọi 2 trường hợp:
  //   (a) COD/wallet: gọi trực tiếp từ submit() — không có otp_code
  //   (b) bank_transfer/card: gọi từ handleOtpVerify() — có otp_code
  const createMutation = useMutation({
    mutationFn: orderService.createOrder,   // POST /api/v1/orders
    onSuccess: async (response) => {
      const newOrder = response?.data
      // Dọn giỏ hàng và cache
      if (isBuyNow) {
        clearBuyNowItem()
      } else {
        await clearCart(false)
      }
      await queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['wallet'] })
      navigate('/order-success', { state: { order: newOrder } })  // BƯỚC 6 xong
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể tạo đơn hàng')
      setOtpModal(null)   // đóng modal nếu đang mở
    },
  })

  // Tập hợp payload gửi lên API tạo đơn — otpCode chỉ có khi là bank_transfer/card
  const buildOrderPayload = (otpCode) => ({
    address_id:    Number(addressId),
    shipping_method: shippingMethod,
    payment_method:  paymentMethod,
    bank_account_id: selectedBank ? Number(selectedBank.id) : undefined,
    customer_note:   customerNote,
    coupon_code:     selectedCoupon?.code || undefined,
    otp_code:        otpCode || undefined,   // backend sẽ validate mã này trong verifyOrderOtp()
    items: isBuyNow
      ? [{ product_id: buyNowItem.product_id, quantity: buyNowItem.quantity }]
      : selectedIds.length
        ? checkoutItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity }))
        : undefined,
    clear_selected_cart_items: !isBuyNow && selectedIds.length > 0,
  })

  // ── BƯỚC 3: Xử lý nút "Đặt hàng" ───────────────────────────────────────────
  const submit = async () => {
    // Validate cơ bản trước khi gọi API
    if (!addressId) { toast.error('Vui lòng chọn địa chỉ giao hàng'); return }
    if (['bank_transfer', 'card'].includes(paymentMethod) && !selectedBank) {
      toast.error('Chọn tài khoản ngân hàng trước khi dùng phương thức thanh toán này')
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < payableTotal) {
      toast.error('Số dư ví không đủ để thanh toán')
      return
    }

    // Nhánh OTP: bank_transfer / card
    if (['bank_transfer', 'card'].includes(paymentMethod)) {
      try {
        // Gọi POST /api/v1/otp/send → backend tạo mã, lưu DB, gửi Gmail
        const res = await orderService.sendOtp()
        const { email_sent, dev_otp } = res.data || {}

        // Nếu email chưa cấu hình → hiện toast kèm mã để test
        if (!email_sent) toast(`Dev OTP: ${dev_otp}`, { icon: '🔑', duration: 30000 })

        // Mở OtpModal (BƯỚC 4) — luồng tiếp theo do người dùng nhập mã
        setOtpModal({ email: user?.email || 'email của bạn', devOtp: dev_otp || null })
      } catch (err) {
        toast.error(err.message || 'Không thể gửi mã OTP')
      }
      return  // dừng — chờ người dùng nhập mã trong modal
    }

    // Nhánh không OTP: COD / wallet — tạo đơn ngay
    createMutation.mutate(buildOrderPayload())
  }

  // ── BƯỚC 5: Người dùng nhấn "Xác nhận & Đặt hàng" trong modal ───────────
  // otpCode là chuỗi 6 chữ số từ ô nhập, được đưa vào payload gửi backend
  const handleOtpVerify = (otpCode) => {
    createMutation.mutate(buildOrderPayload(otpCode))
    // Sau khi mutate thành công → onSuccess điều hướng đến /order-success
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
    <>
      {/* OtpModal chỉ render khi otpModal !== null (sau khi gửi email thành công) */}
      {otpModal && (
        <OtpModal
          email={otpModal.email}
          devOtp={otpModal.devOtp}
          onVerify={handleOtpVerify}
          onClose={() => setOtpModal(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* ── Địa chỉ giao hàng ── */}
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

          {/* ── Mã giảm giá ── */}
          <CouponList selectedCode={selectedCoupon?.code} onSelect={setSelectedCoupon} />

          {/* ── Vận chuyển & Phương thức thanh toán ── */}
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
                  <div className="flex-1">
                    <span className="font-medium">Chuyển khoản ngân hàng</span>
                    <p className="text-sm text-gray-500">
                      {selectedBank
                        ? `Thanh toán qua ${selectedBank.bank_name} - ${selectedBank.bank_account_number}.`
                        : 'Cần liên kết ngân hàng trước khi sử dụng.'}
                    </p>
                    {/* Thông báo OTP sẽ được gửi khi chọn phương thức này */}
                    {paymentMethod === 'bank_transfer' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        🔒 Mã OTP sẽ được gửi về email khi đặt hàng để xác nhận thanh toán.
                      </p>
                    )}
                    {paymentMethod === 'bank_transfer' && (shopSettings?.bank_qr_image || shopSettings?.bank_account_number) && (
                      <div className="mt-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-4 flex flex-col sm:flex-row gap-4 items-center">
                        {shopSettings?.bank_qr_image && (
                          <img src={shopSettings.bank_qr_image} alt="QR chuyển khoản" className="w-36 h-36 object-contain rounded-lg border dark:border-gray-600 bg-white" />
                        )}
                        <div className="text-sm space-y-1 text-left">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">Thông tin chuyển khoản</p>
                          {shopSettings?.bank_name && <p className="text-gray-600 dark:text-gray-300">Ngân hàng: <span className="font-medium">{shopSettings.bank_name}</span></p>}
                          {shopSettings?.bank_account_number && <p className="text-gray-600 dark:text-gray-300">Số TK: <span className="font-medium font-mono">{shopSettings.bank_account_number}</span></p>}
                          {shopSettings?.bank_account_name && <p className="text-gray-600 dark:text-gray-300">Chủ TK: <span className="font-medium">{shopSettings.bank_account_name}</span></p>}
                          <p className="text-yellow-700 dark:text-yellow-400 text-xs pt-1">Nội dung CK sẽ hiển thị sau khi đặt hàng</p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 ${hasLinkedBank ? 'cursor-pointer' : 'opacity-60'}`}>
                  <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} disabled={!hasLinkedBank} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                  <div>
                    <span className="font-medium">Thẻ tín dụng / Thẻ ngân hàng</span>
                    <p className="text-sm text-gray-500">
                      {selectedBank ? `Thanh toán bằng thẻ/ngân hàng ${selectedBank.bank_name}.` : 'Cần liên kết ngân hàng trước khi sử dụng.'}
                    </p>
                    {paymentMethod === 'card' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        🔒 Mã OTP sẽ được gửi về email khi đặt hàng để xác nhận thanh toán.
                      </p>
                    )}
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

        {/* ── Tóm tắt & nút đặt hàng ── */}
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
            <div className="flex justify-between font-bold text-lg">
              <span>Tổng</span>
              <span className="text-primary-600">{formatPrice(payableTotal)}</span>
            </div>
          </div>

          {/* Nhãn nút thay đổi tuỳ phương thức: OTP hay đặt thẳng */}
          <button
            onClick={submit}
            className="btn btn-primary w-full mt-6"
            disabled={createMutation.isPending}
          >
            {['bank_transfer', 'card'].includes(paymentMethod) ? '🔒 Đặt hàng & nhận OTP' : 'Đặt hàng'}
          </button>
        </aside>
      </div>
    </>
  )
}

export default Checkout
