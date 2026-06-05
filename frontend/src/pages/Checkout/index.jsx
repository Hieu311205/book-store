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
import { FiCheckCircle, FiCreditCard, FiEdit2, FiShield, FiX } from 'react-icons/fi'
import { userService } from '../../services/user.service'
import { orderService } from '../../services/order.service'
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

const detectCardIssuer = (cardNumber) => {
  const number = cardNumber.replace(/\D/g, '')
  const napasIssuers = [
    ['970422', 'MB Bank'],
    ['970436', 'Vietcombank'],
    ['970415', 'VietinBank'],
    ['970418', 'BIDV'],
    ['970407', 'Techcombank'],
    ['970432', 'VPBank'],
    ['970423', 'TPBank'],
    ['970416', 'ACB'],
    ['970403', 'Sacombank'],
    ['970405', 'Agribank'],
  ]
  const napasIssuer = napasIssuers.find(([prefix]) => number.startsWith(prefix))
  if (napasIssuer) return { bank: napasIssuer[1], network: 'NAPAS' }
  if (number.startsWith('4')) return { bank: number.startsWith('411111') ? 'Ngân hàng mô phỏng Visa' : 'Ngân hàng phát hành Visa', network: 'VISA' }
  if (/^(5[1-5]|2[2-7])/.test(number)) return { bank: 'Ngân hàng phát hành Mastercard', network: 'MASTERCARD' }
  if (/^35/.test(number)) return { bank: 'Ngân hàng phát hành JCB', network: 'JCB' }
  return { bank: '', network: 'THẺ NGÂN HÀNG' }
}

const formatCardNumber = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')

const formatCardExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

const isCardExpiryValid = (value) => {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false
  const [month, shortYear] = value.split('/').map(Number)
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expiryMonth = new Date(2000 + shortYear, month - 1, 1)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return expiryMonth >= currentMonth
}

const emptyAddressForm = {
  title: '',
  full_name: '',
  phone: '',
  province: '',
  city: '',
  postal_code: '',
  address: '',
  is_default: 0,
}

// ═══════════════════════════════════════════════════════════════════════════════
// BƯỚC 4: OTP Modal — hiển thị sau khi backend gửi email thành công
// ═══════════════════════════════════════════════════════════════════════════════
const OtpModal = ({ email, devOtp, purpose, expiresIn, verifying, onVerify, onClose }) => {
  // expiresIn đến từ server (giây chính xác theo đồng hồ MySQL), fallback 300s
  const [code, setCode]         = useState('')
  const [seconds, setSeconds]   = useState(expiresIn ?? 300)
  const [cooldown, setCooldown] = useState(60)
  const [sending, setSending]   = useState(false)
  const inputsRef               = useRef([])

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

  // Gửi lại OTP: reset countdown theo expires_in trả về từ server
  const resend = useCallback(async () => {
    if (cooldown > 0 || sending) return
    setSending(true)
    try {
      const res = await orderService.sendOtp(purpose)
      toast.success('Đã gửi lại mã OTP')
      // Dùng expires_in từ server để đồng bộ countdown chính xác
      setSeconds(res.data?.expires_in ?? 300)
      setCooldown(60)
      setCode('')
      if (res.data?.dev_otp) toast(`Dev OTP: ${res.data.dev_otp}`, { icon: '🔑' })
    } catch (err) {
      toast.error(err.message || 'Không thể gửi lại OTP')
    } finally {
      setSending(false)
    }
  }, [cooldown, sending, purpose])

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

        {/* Đồng hồ đếm ngược — đồng bộ từ server, chỉ mang tính tham khảo */}
        <div className="otp-timer">
          {seconds > 0 ? (
            <span>Mã hết hạn sau <strong>{fmt(seconds)}</strong></span>
          ) : (
            <span className="expired">⚠️ Có thể đã hết hạn — thử gửi lại nếu bị từ chối</span>
          )}
        </div>

        {/* BƯỚC 5: Không chặn submit khi seconds === 0 — backend là nguồn xác thực chính xác */}
        <button
          className="otp-submit"
          disabled={code.length < 6 || verifying}
          onClick={() => onVerify(code)}
        >
          {verifying ? 'Đang xác minh...' : 'Xác nhận & Đặt hàng'}
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
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm]       = useState(emptyAddressForm)
  const [shippingMethod, setShippingMethod] = useState('giao_hang_tiet_kiem')
  const [customerNote, setCustomerNote]     = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('cod')
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [cardNumber, setCardNumber]         = useState('')
  const [cardExpiry, setCardExpiry]         = useState('')
  const [cardCvv, setCardCvv]               = useState('')
  const [cardHolder, setCardHolder]         = useState('')
  const [cardPhone, setCardPhone]           = useState('')
  const [cardMode, setCardMode]             = useState('domestic')

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
  const selectedAddress = useMemo(
    () => addresses?.find((address) => String(address.id) === String(addressId)),
    [addresses, addressId],
  )
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: userService.getWallet,
    select: (res) => res.data,
  })
  const walletBalance = Number(walletData?.wallet?.balance || 0)
  const cardIssuer = useMemo(() => detectCardIssuer(cardNumber), [cardNumber])
  const cardExpiryValid = !cardExpiry || isCardExpiryValid(cardExpiry)

  useEffect(() => {
    if (!addressId && addresses?.length) {
      setAddressId(String(addresses[0].id))
    }
  }, [addressId, addresses])

  const openAddressEditor = (address) => {
    setEditingAddress(address)
    setAddressForm({
      title: address.title || '',
      full_name: address.full_name || '',
      phone: address.phone || '',
      province: address.province || '',
      city: address.city || '',
      postal_code: address.postal_code || '',
      address: address.address || '',
      is_default: Number(address.is_default || 0),
    })
  }

  const closeAddressEditor = () => {
    setEditingAddress(null)
    setAddressForm(emptyAddressForm)
  }

  const updateAddressForm = (field, value) => {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateAddress(id, data),
    onSuccess: async (response) => {
      const updatedAddress = response?.data?.data
      await queryClient.invalidateQueries({ queryKey: ['addresses'] })
      if (updatedAddress?.id) {
        setAddressId(String(updatedAddress.id))
      }
      closeAddressEditor()
      toast.success('Đã cập nhật địa chỉ giao hàng')
    },
    onError: (error) => {
      toast.error(error.message || 'Không thể cập nhật địa chỉ')
    },
  })

  const saveAddress = (event) => {
    event.preventDefault()
    if (!editingAddress) return
    if (!addressForm.full_name.trim() || !addressForm.phone.trim() || !addressForm.address.trim()) {
      toast.error('Vui lòng nhập tên, số điện thoại và địa chỉ')
      return
    }
    if (!/^\d{9,11}$/.test(addressForm.phone.replace(/\D/g, ''))) {
      toast.error('Số điện thoại phải có 9-11 chữ số')
      return
    }
    updateAddressMutation.mutate({
      id: editingAddress.id,
      data: {
        ...addressForm,
        phone: addressForm.phone.replace(/\D/g, ''),
        is_default: addressForm.is_default ? 1 : 0,
      },
    })
  }
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
    },
  })

  // Tập hợp payload gửi lên API tạo đơn — otpCode chỉ có khi là bank_transfer/card
  const buildOrderPayload = (otpCode) => ({
    address_id:    Number(addressId),
    shipping_method: shippingMethod,
    payment_method:  paymentMethod,
    customer_note:   customerNote,
    coupon_code:     selectedCoupon?.code || undefined,
    otp_code:        otpCode || undefined,   // backend sẽ validate mã này trong verifyOrderOtp()
    card_number:     paymentMethod === 'card' ? cardNumber : undefined,
    card_expiry:     paymentMethod === 'card' ? cardExpiry : undefined,
    card_cvv:        paymentMethod === 'card' ? cardCvv : undefined,
    card_holder:     paymentMethod === 'card' ? cardHolder : undefined,
    card_phone:      paymentMethod === 'card' ? cardPhone : undefined,
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
    const requiresCardCvv = cardIssuer.network !== 'NAPAS'
    if (paymentMethod === 'card' && !/^\d{16}$/.test(cardNumber)) {
      toast.error('Số thẻ phải gồm đúng 16 chữ số')
      return
    }
    if (paymentMethod === 'card' && !isCardExpiryValid(cardExpiry)) {
      toast.error('Ngày hết hạn phải theo định dạng MM/YY và không được ở quá khứ')
      return
    }
    if (paymentMethod === 'card' && ((requiresCardCvv && !/^\d{3}$/.test(cardCvv)) || (!requiresCardCvv && cardCvv && !/^\d{3}$/.test(cardCvv)))) {
      toast.error(requiresCardCvv ? 'CVV phải gồm đúng 3 chữ số' : 'Nếu nhập CVV, vui lòng dùng đúng 3 chữ số')
      return
    }
    if (paymentMethod === 'card' && (!cardHolder.trim() || !/^\d{9,11}$/.test(cardPhone))) {
      toast.error('Nhập tên in trên thẻ và số điện thoại hợp lệ')
      return
    }
    if (paymentMethod === 'card' && cardNumber === '4000000000000002') {
      toast.error('Thẻ test bị từ chối thanh toán')
      return
    }
    if (paymentMethod === 'card' && cardNumber === '4000000000009995') {
      toast.error('Thẻ test không đủ số dư')
      return
    }
    if (paymentMethod === 'card' && cardNumber !== '4111111111111111' && cardIssuer.network !== 'NAPAS') {
      toast.error('Chỉ chấp nhận thẻ test Visa hoặc thẻ NAPAS mô phỏng')
      return
    }
    if (paymentMethod === 'wallet' && walletBalance < payableTotal) {
      toast.error('Số dư ví không đủ để thanh toán')
      return
    }

    // Nhánh OTP: thẻ test / ví điện tử
    if (['card', 'wallet'].includes(paymentMethod)) {
      try {
        // Gọi POST /api/v1/otp/send → backend tạo mã, lưu DB, gửi Gmail
        const res = await orderService.sendOtp(paymentMethod)
        const { email_sent, dev_otp, expires_in } = res.data || {}

        // Nếu email chưa cấu hình → hiện toast kèm mã để test
        if (!email_sent) toast(`Dev OTP: ${dev_otp}`, { icon: '🔑', duration: 30000 })

        // Dùng expires_in từ server để countdown đồng bộ chính xác
        setOtpModal({ email: user?.email || 'email của bạn', devOtp: dev_otp || null, purpose: paymentMethod, expiresIn: expires_in ?? 300 })
      } catch (err) {
        toast.error(err.message || 'Không thể gửi mã OTP')
      }
      return  // dừng — chờ người dùng nhập mã trong modal
    }

    // Nhánh không OTP: COD / chuyển khoản QR
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
          purpose={otpModal.purpose}
          expiresIn={otpModal.expiresIn}
          verifying={createMutation.isPending}
          onVerify={handleOtpVerify}
          onClose={() => setOtpModal(null)}
        />
      )}

      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(event) => event.target === event.currentTarget && closeAddressEditor()}>
          <form onSubmit={saveAddress} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Sửa địa chỉ giao hàng</h2>
                <p className="mt-1 text-sm text-gray-500">Địa chỉ này sẽ được dùng cho đơn hàng hiện tại sau khi lưu.</p>
              </div>
              <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={closeAddressEditor} aria-label="Đóng">
                <FiX />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-semibold">Tên người nhận</span>
                <input className="input" value={addressForm.full_name} onChange={(event) => updateAddressForm('full_name', event.target.value)} placeholder="Nguyen Van A" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Số điện thoại</span>
                <input className="input" value={addressForm.phone} onChange={(event) => updateAddressForm('phone', event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="0912345678" inputMode="numeric" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Tỉnh/Thành phố</span>
                <input className="input" value={addressForm.province} onChange={(event) => updateAddressForm('province', event.target.value)} placeholder="Ha Noi" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Quận/Huyện</span>
                <input className="input" value={addressForm.city} onChange={(event) => updateAddressForm('city', event.target.value)} placeholder="Tu Liem" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Tên gợi nhớ</span>
                <input className="input" value={addressForm.title} onChange={(event) => updateAddressForm('title', event.target.value)} placeholder="Nhà riêng" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-semibold">Mã bưu chính</span>
                <input className="input" value={addressForm.postal_code} onChange={(event) => updateAddressForm('postal_code', event.target.value)} placeholder="100000" />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-semibold">Địa chỉ cụ thể</span>
                <textarea className="input min-h-24" value={addressForm.address} onChange={(event) => updateAddressForm('address', event.target.value)} placeholder="Số nhà, đường, phường/xã" />
              </label>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(addressForm.is_default)} onChange={(event) => updateAddressForm('is_default', event.target.checked ? 1 : 0)} />
              Đặt làm địa chỉ mặc định
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-outline" onClick={closeAddressEditor}>Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={updateAddressMutation.isPending}>
                {updateAddressMutation.isPending ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* ── Địa chỉ giao hàng ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-4">Thanh toán</h1>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Địa chỉ giao hàng</h2>
              
            </div>
            {addresses?.length ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex gap-3 border rounded-lg p-4 ${String(addressId) === String(address.id) ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-900/10' : 'dark:border-gray-700'}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={String(addressId) === String(address.id)}
                      onChange={(event) => setAddressId(event.target.value)}
                    />
                    <button type="button" className="flex-1 text-left" onClick={() => setAddressId(String(address.id))}>
                      <span className="font-medium block">{address.full_name} - {address.phone}</span>
                      <span className="text-sm text-gray-500">{address.address}, {address.city}, {address.province}</span>
                    </button>
                    <button type="button" className="self-start rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700" onClick={() => openAddressEditor(address)} aria-label="Sửa địa chỉ">
                      <FiEdit2 />
                    </button>
                  </div>
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
                  <div className="flex-1">
                    <span className="font-medium">Chuyển khoản ngân hàng</span>
                    <p className="text-sm text-gray-500">Quét QR hoặc chuyển khoản vào tài khoản của shop sau khi đặt hàng.</p>
                    {paymentMethod === 'bank_transfer' && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Shop sẽ xác nhận đơn sau khi nhận được tiền chuyển khoản.
                      </p>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                  <input type="radio" name="payment_method" value="card" checked={paymentMethod === 'card'} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1" />
                  <div className="flex-1">
                    <span className="font-medium">Thẻ tín dụng / Thẻ ngân hàng</span>
                    <p className="text-sm text-gray-500">Cổng thanh toán thẻ mô phỏng, không lưu số thẻ hoặc CVV.</p>
                    {paymentMethod === 'card' && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-orange-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                          <div>
                            <p className="font-semibold">Thông tin thẻ ngân hàng</p>
                            <p className="mt-0.5 text-xs text-gray-500">Tên ngân hàng được tự động nhận diện theo số thẻ.</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                            <FiShield />
                            Bảo mật OTP
                          </div>
                        </div>

                        <div className="grid gap-4 p-4 lg:grid-cols-[160px_1fr]">
                          <div className="space-y-2">
                            <button
                              type="button"
                              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm ${cardMode === 'domestic' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' : 'border-gray-200 dark:border-gray-600'}`}
                              onClick={() => setCardMode('domestic')}
                            >
                              <FiCreditCard />
                              <span><strong>Thẻ nội địa</strong><br /><small>ATM / NAPAS</small></span>
                            </button>
                            <button
                              type="button"
                              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm ${cardMode === 'international' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' : 'border-gray-200 dark:border-gray-600'}`}
                              onClick={() => setCardMode('international')}
                            >
                              <FiCreditCard />
                              <span><strong>Thẻ quốc tế</strong><br /><small>Visa / Mastercard / JCB</small></span>
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {['NAPAS', 'VISA', 'MASTERCARD', 'JCB'].map((network) => (
                                <span key={network} className={`rounded border px-2 py-1 text-xs font-bold ${cardIssuer.network === network ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' : 'border-gray-200 text-gray-400 dark:border-gray-600'}`}>
                                  {network}
                                </span>
                              ))}
                            </div>

                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-gray-500">Số thẻ</span>
                              <input
                                className="input"
                                value={formatCardNumber(cardNumber)}
                                onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16))}
                                placeholder="4111 1111 1111 1111"
                                inputMode="numeric"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-gray-500">Tên ngân hàng</span>
                              <div className="relative">
                                <input className="input pr-9" value={cardIssuer.bank} readOnly placeholder="Tự động điền theo số thẻ" />
                                {cardIssuer.bank && <FiCheckCircle className="absolute right-3 top-2.5 text-green-600" />}
                              </div>
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-gray-500">Tên in trên thẻ</span>
                              <input className="input uppercase" value={cardHolder} onChange={(event) => setCardHolder(event.target.value.toUpperCase())} placeholder="NGUYEN VAN A" />
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-gray-500">Số điện thoại chủ thẻ</span>
                              <input className="input" value={cardPhone} onChange={(event) => setCardPhone(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="0912345678" inputMode="numeric" />
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                              <label>
                                <span className="mb-1 block text-xs font-semibold text-gray-500">Ngày hết hạn</span>
                                <input className={`input ${cardExpiryValid ? '' : 'border-red-500'}`} value={cardExpiry} onChange={(event) => setCardExpiry(formatCardExpiry(event.target.value))} placeholder="MM/YY" inputMode="numeric" />
                                {!cardExpiryValid && <span className="mt-1 block text-xs text-red-500">Tháng phải từ 01–12 và hạn thẻ không được ở quá khứ.</span>}
                              </label>
                              <label>
                                <span className="mb-1 block text-xs font-semibold text-gray-500">CVV</span>
                                <input className="input" value={cardCvv} onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder={cardIssuer.network === 'NAPAS' ? 'Không bắt buộc' : '123'} inputMode="numeric" type="password" />
                              </label>
                            </div>

                            <p className="text-xs text-blue-600 dark:text-blue-400">Gửi mã OTP qua email để xác nhận giao dịch. OTP hết hạn sau 5 phút.</p>
                            {cardIssuer.network === 'NAPAS' && <p className="text-xs text-gray-500">CVV không bắt buộc với thẻ nội địa NAPAS trong luồng mô phỏng.</p>}
                            <p className="text-xs text-gray-500">Thẻ test: NAPAS đầu số 9704 hoặc Visa 4111111111111111 thành công; 4000000000000002 bị từ chối; 4000000000009995 không đủ số dư.</p>
                          </div>
                        </div>
                      </div>
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
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">🔒 OTP email sẽ được gửi trước khi trừ tiền ví.</p>
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
            {paymentMethod === 'bank_transfer' && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Xác nhận</span>
                <span>Shop kiểm tra chuyển khoản</span>
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
            {['card', 'wallet'].includes(paymentMethod) ? '🔒 Thanh toán & nhận OTP' : 'Đặt hàng'}
          </button>
        </aside>
      </div>
    </>
  )
}

export default Checkout
