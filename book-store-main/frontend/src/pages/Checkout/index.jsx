import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '../../services/user.service'
import { orderService } from '../../services/order.service'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatPrice'

const Checkout = () => {
  const navigate = useNavigate()
  const { items, summary, clearCart } = useCart()
  const [addressId, setAddressId] = useState('')
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [customerNote, setCustomerNote] = useState('')

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: async () => {
      await clearCart()
      toast.success('Da tao don hang')
      navigate('/profile/orders')
    },
    onError: (error) => toast.error(error.message || 'Khong the tao don hang'),
  })

  const submit = () => {
    if (!addressId) {
      toast.error('Vui long chon dia chi giao hang')
      return
    }
    createMutation.mutate({
      address_id: Number(addressId),
      shipping_method: shippingMethod,
      customer_note: customerNote,
    })
  }

  if (!items.length) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Gio hang dang trong</h1>
        <Link to="/products" className="btn btn-primary">Xem sach</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-4">Thanh toan</h1>
          <h2 className="font-semibold mb-3">Dia chi giao hang</h2>
          {addresses?.length ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label key={address.id} className="flex gap-3 border dark:border-gray-700 rounded-lg p-4 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={String(addressId) === String(address.id)}
                    onChange={(e) => setAddressId(e.target.value)}
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
              Ban chua co dia chi. <Link className="text-primary-600" to="/profile/addresses">Them dia chi</Link>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Van chuyen</h2>
          <select className="input max-w-sm" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
            <option value="standard">Tieu chuan - 25.000 d</option>
            <option value="express">Nhanh - 50.000 d</option>
          </select>
          <textarea
            className="input mt-4 min-h-24"
            placeholder="Ghi chu cho don hang"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
          />
        </div>
      </div>

      <aside className="bg-white dark:bg-gray-800 rounded-xl p-6 h-fit">
        <h2 className="font-bold mb-4">Tom tat</h2>
        <div className="space-y-2 text-sm mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span className="truncate">{item.title} x {item.quantity}</span>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between"><span>Tam tinh</span><span>{formatPrice(summary.subtotal)}</span></div>
          <div className="flex justify-between"><span>Van chuyen</span><span>{formatPrice(shippingMethod === 'express' ? 50000 : 25000)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Tong</span><span className="text-primary-600">{formatPrice(summary.total + (shippingMethod === 'express' ? 50000 : 25000))}</span></div>
        </div>
        <button onClick={submit} className="btn btn-primary w-full mt-6" disabled={createMutation.isPending}>
          Dat hang
        </button>
      </aside>
    </div>
  )
}

export default Checkout
