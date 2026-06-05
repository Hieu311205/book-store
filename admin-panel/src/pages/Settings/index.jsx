import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiCreditCard, FiKey, FiSave, FiUpload, FiUser } from 'react-icons/fi'
import { adminService } from '../../services/admin.service'
import { useAuth } from '../../context/AuthContext'

const emptyPasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

const getSettingValue = (settings, key) => (
  settings.find((setting) => setting.key_name === key)?.value || ''
)

const Settings = () => {
  const queryClient = useQueryClient()
  const qrInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const { user, isSuperAdmin, updateCurrentUser } = useAuth()

  const [accountForm, setAccountForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    bank_qr_image: '',
  })

  useEffect(() => {
    setAccountForm({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      avatar_url: user?.avatar_url || '',
    })
  }, [user])

  const { data: settings = [], isLoading: isSettingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminService.getSettings,
    select: (res) => res.data || [],
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    if (!isSuperAdmin) return
    setBankForm({
      bank_name: getSettingValue(settings, 'bank_name'),
      bank_account_number: getSettingValue(settings, 'bank_account_number'),
      bank_account_name: getSettingValue(settings, 'bank_account_name'),
      bank_qr_image: getSettingValue(settings, 'bank_qr_image'),
    })
  }, [isSuperAdmin, settings])

  const settingsByKey = useMemo(() => (
    Object.fromEntries(settings.map((setting) => [setting.key_name, setting]))
  ), [settings])

  const accountMutation = useMutation({
    mutationFn: adminService.updateMe,
    onSuccess: (res) => {
      const nextUser = res.data?.user
      if (nextUser) updateCurrentUser(nextUser)
      toast.success(res.message || 'Đã cập nhật thông tin tài khoản')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật thông tin tài khoản'),
  })

  const passwordMutation = useMutation({
    mutationFn: adminService.changePassword,
    onSuccess: (res) => {
      setPasswordForm(emptyPasswordForm)
      toast.success(res.message || 'Đã đổi mật khẩu')
    },
    onError: (error) => toast.error(error.message || 'Không thể đổi mật khẩu'),
  })

  const bankMutation = useMutation({
    mutationFn: async (payload) => {
      const entries = [
        ['bank_name', payload.bank_name],
        ['bank_account_number', payload.bank_account_number],
        ['bank_account_name', payload.bank_account_name],
        ['bank_qr_image', payload.bank_qr_image],
      ]

      await Promise.all(entries.map(([key, value]) => {
        const setting = settingsByKey[key]
        const data = {
          key_name: key,
          value: value || '',
          type: 'string',
          group_name: 'payment',
        }
        return setting
          ? adminService.updateSetting(setting.id, data)
          : adminService.createSetting(data)
      }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-public-settings'] })
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
      toast.success('Đã lưu thông tin tài khoản ngân hàng')
    },
    onError: (error) => toast.error(error.message || 'Không thể lưu thông tin ngân hàng'),
  })

  const qrUploadMutation = useMutation({
    mutationFn: adminService.uploadBankQr,
    onSuccess: (res) => {
      const imageUrl = res.data?.image_url || ''
      setBankForm((current) => ({ ...current, bank_qr_image: imageUrl }))
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      toast.success(res.message || 'Đã tải ảnh mã QR')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải ảnh mã QR'),
  })

  const avatarUploadMutation = useMutation({
    mutationFn: (file) => {
      const data = new FormData()
      data.append('avatar', file)
      return adminService.uploadAvatar(data)
    },
    onSuccess: (res) => {
      const imageUrl = res.data?.image_url || ''
      const nextUser = res.data?.user
      if (imageUrl) {
        setAccountForm((current) => ({ ...current, avatar_url: imageUrl }))
      }
      if (nextUser) updateCurrentUser(nextUser)
      toast.success(res.message || 'Đã tải ảnh đại diện')
    },
    onError: (error) => toast.error(error.message || 'Không thể tải ảnh đại diện'),
  })

  const submitAccount = (event) => {
    event.preventDefault()
    accountMutation.mutate({
      first_name: accountForm.first_name.trim(),
      last_name: accountForm.last_name.trim(),
      phone: accountForm.phone.trim(),
      avatar_url: accountForm.avatar_url.trim(),
    })
  }

  const submitPassword = (event) => {
    event.preventDefault()
    passwordMutation.mutate(passwordForm)
  }

  const submitBank = (event) => {
    event.preventDefault()
    bankMutation.mutate(bankForm)
  }

  const uploadQrImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const data = new FormData()
    data.append('qr_image', file)
    qrUploadMutation.mutate(data)
    event.target.value = ''
  }

  const uploadAvatarImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    avatarUploadMutation.mutate(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase text-primary-600">Tài khoản & bảo mật</p>
        <h1 className="mt-1 text-2xl font-bold">Cài đặt</h1>
      </div>

      <form onSubmit={submitAccount} className="card p-5 space-y-4">
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={uploadAvatarImage}
        />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <FiUser />
          </div>
          <div>
            <h2 className="font-bold">Thông tin tài khoản</h2>
            <p className="text-sm text-gray-500">Cập nhật tên, số điện thoại và ảnh đại diện của tài khoản đang đăng nhập.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm font-medium">Tên</span>
            <input
              className="input"
              value={accountForm.first_name}
              onChange={(event) => setAccountForm({ ...accountForm, first_name: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Họ</span>
            <input
              className="input"
              value={accountForm.last_name}
              onChange={(event) => setAccountForm({ ...accountForm, last_name: event.target.value })}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input className="input opacity-70" value={user?.email || ''} disabled />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Số điện thoại</span>
            <input
              className="input"
              value={accountForm.phone}
              onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })}
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Ảnh đại diện URL</span>
            {accountForm.avatar_url && (
              <img
                src={accountForm.avatar_url}
                alt="Ảnh đại diện"
                className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
            )}
            <button
              type="button"
              className="btn btn-outline w-fit"
              disabled={avatarUploadMutation.isPending}
              onClick={() => avatarInputRef.current?.click()}
            >
              <FiUpload />
              {avatarUploadMutation.isPending ? 'Đang tải...' : 'Chọn ảnh đại diện'}
            </button>
            <input
              className="input"
              value={accountForm.avatar_url}
              onChange={(event) => setAccountForm({ ...accountForm, avatar_url: event.target.value })}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={accountMutation.isPending}>
            <FiSave />
            {accountMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      <form onSubmit={submitPassword} className="card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <FiKey />
          </div>
          <div>
            <h2 className="font-bold">Đổi mật khẩu</h2>
            <p className="text-sm text-gray-500">Mật khẩu mới tối thiểu 6 ký tự.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1">
            <span className="text-sm font-medium">Mật khẩu hiện tại</span>
            <input
              className="input"
              type="password"
              value={passwordForm.current_password}
              onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })}
              autoComplete="current-password"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Mật khẩu mới</span>
            <input
              className="input"
              type="password"
              required
              value={passwordForm.new_password}
              onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })}
              autoComplete="new-password"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Nhập lại mật khẩu mới</span>
            <input
              className="input"
              type="password"
              required
              value={passwordForm.confirm_password}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirm_password: event.target.value })}
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={passwordMutation.isPending}>
            <FiKey />
            {passwordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>

      {isSuperAdmin && (
        <form onSubmit={submitBank} className="card p-5 space-y-4">
          <input
            ref={qrInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={uploadQrImage}
          />

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <FiCreditCard />
            </div>
            <div>
              <h2 className="font-bold">Thông tin tài khoản ngân hàng</h2>
              <p className="text-sm text-gray-500">Chỉ super admin được thay đổi thông tin nhận chuyển khoản.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Ngân hàng</span>
              <input
                className="input"
                value={bankForm.bank_name}
                onChange={(event) => setBankForm({ ...bankForm, bank_name: event.target.value })}
                disabled={isSettingsLoading}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Số tài khoản</span>
              <input
                className="input"
                value={bankForm.bank_account_number}
                onChange={(event) => setBankForm({ ...bankForm, bank_account_number: event.target.value })}
                disabled={isSettingsLoading}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Chủ tài khoản</span>
              <input
                className="input"
                value={bankForm.bank_account_name}
                onChange={(event) => setBankForm({ ...bankForm, bank_account_name: event.target.value })}
                disabled={isSettingsLoading}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <label className="space-y-1">
              <span className="text-sm font-medium">Ảnh mã QR</span>
              <input
                className="input"
                value={bankForm.bank_qr_image}
                onChange={(event) => setBankForm({ ...bankForm, bank_qr_image: event.target.value })}
                disabled={isSettingsLoading}
              />
            </label>
            <button
              type="button"
              className="btn btn-outline"
              disabled={qrUploadMutation.isPending}
              onClick={() => qrInputRef.current?.click()}
            >
              <FiUpload />
              {qrUploadMutation.isPending ? 'Đang tải...' : 'Tải QR'}
            </button>
          </div>

          {bankForm.bank_qr_image && (
            <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <img
                src={bankForm.bank_qr_image}
                alt="QR chuyển khoản"
                className="h-24 w-24 rounded-lg bg-white object-contain p-1"
              />
              <div className="text-sm text-gray-500">
                <p>Ảnh này sẽ hiển thị ở màn hình thanh toán chuyển khoản.</p>
                <p className="mt-1 break-all">{bankForm.bank_qr_image}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button className="btn btn-primary" disabled={bankMutation.isPending || isSettingsLoading}>
              <FiSave />
              {bankMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default Settings
