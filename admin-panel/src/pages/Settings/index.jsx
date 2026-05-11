import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'

const emptyForm = { key_name: '', value: '', type: 'string', group_name: 'general' }

const Settings = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminService.getSettings,
    select: (res) => res.data || [],
  })

  const createMutation = useMutation({
    mutationFn: adminService.createSetting,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings'])
      setForm(emptyForm)
      toast.success('Đã thêm cài đặt')
    },
    onError: (error) => toast.error(error.message || 'Không thể thêm cài đặt'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateSetting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings'])
      toast.success('Đã lưu cài đặt')
    },
    onError: (error) => toast.error(error.message || 'Không thể lưu cài đặt'),
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings'])
      toast.success('Đã xóa cài đặt')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa cài đặt'),
  })

  const submit = (event) => {
    event.preventDefault()
    createMutation.mutate(form)
  }

  const updateField = (id, key, value) => {
    const item = settings.find((setting) => setting.id === id)
    if (!item) return
    updateMutation.mutate({
      id,
      data: {
        key_name: item.key_name,
        value: key === 'value' ? value : item.value,
        type: key === 'type' ? value : item.type,
        group_name: key === 'group_name' ? value : item.group_name,
      },
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <form onSubmit={submit} className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="input"
          placeholder="Key"
          required
          value={form.key_name}
          onChange={(e) => setForm({ ...form, key_name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Giá trị"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
        />
        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="json">json</option>
        </select>
        <input
          className="input"
          placeholder="Nhóm"
          value={form.group_name}
          onChange={(e) => setForm({ ...form, group_name: e.target.value })}
        />
        <button className="btn btn-primary" type="submit">
          <FiPlus /> Thêm
        </button>
      </form>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Giá trị</th>
                <th>Kiểu</th>
                <th>Nhóm</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
              ) : settings.length ? settings.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.key_name}</td>
                  <td>
                    <input
                      className="input"
                      defaultValue={item.value || ''}
                      onBlur={(e) => updateField(item.id, 'value', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      defaultValue={item.type}
                      onChange={(e) => updateField(item.id, 'type', e.target.value)}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="json">json</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="input"
                      defaultValue={item.group_name || ''}
                      onBlur={(e) => updateField(item.id, 'group_name', e.target.value)}
                    />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      title="Lưu bằng rời mất focus"
                      className="text-gray-400 mr-3"
                      disabled
                    >
                      <FiSave />
                    </button>
                    <button type="button" onClick={() => deleteMutation.mutate(item.id)} className="text-red-500">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chưa có cài đặt trong database</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Settings
