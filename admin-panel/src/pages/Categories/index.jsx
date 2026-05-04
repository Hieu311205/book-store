import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const Categories = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', name_en: '', sort_order: 0, is_active: 1 })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getCategories,
    select: (res) => res.data,
  })

  const createMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories'])
      setForm({ name: '', name_en: '', sort_order: 0, is_active: 1 })
      toast.success('Đã thêm danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm danh mục'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories'])
      toast.success('Đã xóa danh mục')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa danh mục'),
  })

  const submit = (event) => {
    event.preventDefault()
    createMutation.mutate({ ...form, is_active: Number(form.is_active), sort_order: Number(form.sort_order) })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Danh mục</h1>
      <form onSubmit={submit} className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="input" placeholder="Tên danh mục" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Tên tiếng Anh" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        <input className="input" type="number" placeholder="Thứ tự" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        <select className="input" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
          <option value={1}>Hiện</option>
          <option value={0}>Ẩn</option>
        </select>
        <button className="btn btn-primary"><FiPlus /> Thêm</button>
      </form>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Tên</th><th>Slug</th><th>Thứ tự</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
              ) : data?.length ? data.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.slug}</td>
                  <td>{item.sort_order}</td>
                  <td><span className={`badge ${item.is_active ? 'badge-success' : 'badge-danger'}`}>{item.is_active ? 'Hiện' : 'Ẩn'}</span></td>
                  <td>
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-red-500"><FiTrash2 /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chưa có danh mục</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Categories
