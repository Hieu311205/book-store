import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiTrash2, FiCheck } from 'react-icons/fi'
import { userService } from '../../services/user.service'

const emptyForm = {
  title: '',
  full_name: '',
  phone: '',
  province: '',
  city: '',
  postal_code: '',
  address: '',
  is_default: false,
}

const Addresses = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: userService.getAddresses,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: userService.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses'])
      setForm(emptyForm)
      toast.success('Đã lưu địa chỉ')
    },
    onError: (error) => toast.error(error.message || 'Không thể lưu địa chỉ'),
  })

  const deleteMutation = useMutation({
    mutationFn: userService.deleteAddress,
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  })

  const defaultMutation = useMutation({
    mutationFn: userService.setDefaultAddress,
    onSuccess: () => queryClient.invalidateQueries(['addresses']),
  })

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const submit = (event) => {
    event.preventDefault()
    createMutation.mutate({ ...form, is_default: form.is_default ? 1 : 0 })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Thêm địa chỉ</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Tên gợi nhớ" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          <input className="input" placeholder="Họ tên" required value={form.full_name} onChange={(e) => updateField('full_name', e.target.value)} />
          <input className="input" placeholder="Số điện thoại" required value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          <input className="input" placeholder="Tỉnh/Thành" value={form.province} onChange={(e) => updateField('province', e.target.value)} />
          <input className="input" placeholder="Quận/Huyện" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          <input className="input" placeholder="Mã bưu điện" value={form.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} />
          <textarea className="input md:col-span-2 min-h-24" placeholder="Địa chỉ chi tiết" required value={form.address} onChange={(e) => updateField('address', e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => updateField('is_default', e.target.checked)} />
            Đặt làm địa chỉ mặc định
          </label>
          <div className="md:col-span-2">
            <button className="btn btn-primary" disabled={createMutation.isPending}>Lưu địa chỉ</button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Địa chỉ đã lưu</h2>
        {isLoading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : data?.length ? (
          <div className="space-y-3">
            {data.map((address) => (
              <div key={address.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {address.title || 'Địa chỉ'} {address.is_default ? <span className="badge badge-success ml-2">Mặc định</span> : null}
                    </p>
                    <p className="text-sm text-gray-500">{address.full_name} - {address.phone}</p>
                    <p className="text-sm">{address.address}, {address.city}, {address.province}</p>
                  </div>
                  <div className="flex gap-2">
                    {!address.is_default && (
                      <button onClick={() => defaultMutation.mutate(address.id)} className="text-primary-600" title="Đặt mặc định"><FiCheck /></button>
                    )}
                    <button onClick={() => deleteMutation.mutate(address.id)} className="text-red-500" title="Xóa"><FiTrash2 /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Chưa lưu địa chỉ</p>
        )}
      </div>
    </div>
  )
}

export default Addresses
