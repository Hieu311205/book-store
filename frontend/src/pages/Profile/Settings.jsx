import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { useAuth } from '../../context/AuthContext'

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    setForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      avatar_url: user?.avatar_url || '',
    })
    setPasswordForm(emptyPasswordForm)
  }, [user?.id, user?.first_name, user?.last_name, user?.phone, user?.avatar_url])

  const submitProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await authService.updateMe(form)
      updateUser(response.data.user)
      toast.success('Đã cập nhật hồ sơ')
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật')
    } finally {
      setSaving(false)
    }
  }

  const submitPassword = async (event) => {
    event.preventDefault()

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    setChangingPassword(true)
    try {
      await authService.changePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      toast.success('Đã đổi mật khẩu')
    } catch (error) {
      toast.error(error.message || 'Không thể đổi mật khẩu')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Cài đặt tài khoản</h2>
        <form onSubmit={submitProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="input" placeholder="Tên" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="input" placeholder="Họ" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <input className="input" placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="Avatar URL" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
          <div className="md:col-span-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-2">Đổi mật khẩu</h2>

        <form onSubmit={submitPassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="input"
            type="password"
            placeholder="Mật khẩu hiện cũ"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Mật khẩu mới"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
          />
          <input
            className="input"
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
          />
          <div className="md:col-span-3">
            <button className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
