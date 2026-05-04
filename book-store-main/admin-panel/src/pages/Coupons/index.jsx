import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  min_purchase: 0,
  max_discount: '',
  usage_limit: '',
  is_active: 1,
}

const Coupons = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: adminService.getCoupons,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: adminService.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-coupons'])
      setForm(emptyForm)
      toast.success('Da tao ma giam gia')
    },
    onError: (error) => toast.error(error.message || 'Khong the tao ma'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCoupon,
    onSuccess: () => queryClient.invalidateQueries(['admin-coupons']),
  })

  const submit = (event) => {
    event.preventDefault()
    createMutation.mutate({
      ...form,
      value: Number(form.value),
      min_purchase: Number(form.min_purchase || 0),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: Number(form.is_active),
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ma giam gia</h1>
      <form onSubmit={submit} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="input" placeholder="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="percentage">Phan tram</option>
          <option value="fixed">So tien</option>
        </select>
        <input className="input" type="number" placeholder="Gia tri" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input className="input" type="number" placeholder="Don toi thieu" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} />
        <input className="input" type="number" placeholder="Giam toi da" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
        <input className="input" type="number" placeholder="Luot dung" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
        <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
          <option value={1}>Kich hoat</option>
          <option value={0}>Tat</option>
        </select>
        <button className="btn btn-primary"><FiPlus /> Them</button>
      </form>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Code</th><th>Loai</th><th>Gia tri</th><th>Da dung</th><th>Trang thai</th><th></th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Dang tai...</td></tr>
              ) : data?.length ? data.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.code}</td>
                  <td>{item.type}</td>
                  <td>{item.value}</td>
                  <td>{item.used_count || 0}/{item.usage_limit || '-'}</td>
                  <td><span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>{item.is_active ? 'Bat' : 'Tat'}</span></td>
                  <td><button onClick={() => deleteMutation.mutate(item.id)} className="text-red-500"><FiTrash2 /></button></td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chua co ma</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Coupons
