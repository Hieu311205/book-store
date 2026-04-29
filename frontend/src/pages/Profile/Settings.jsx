import { useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { useAuth } from '../../context/AuthContext'

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await authService.updateMe(form)
      updateUser(response.data.user)
      toast.success('Da cap nhat ho so')
    } catch (error) {
      toast.error(error.message || 'Khong the cap nhat')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Cai dat tai khoan</h2>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="input" placeholder="Ten" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input className="input" placeholder="Ho" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input className="input" placeholder="So dien thoai" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Avatar URL" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
        <div className="md:col-span-2">
          <button className="btn btn-primary" disabled={saving}>Luu thay doi</button>
        </div>
      </form>
    </div>
  )
}

export default Settings
