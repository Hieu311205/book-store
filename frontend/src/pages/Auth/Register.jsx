import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import GoogleLoginButton from '../../components/auth/GoogleLoginButton'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [devOtp, setDevOtp] = useState(null)
  const [otpEmailSent, setOtpEmailSent] = useState(false)
  const [otpDevError, setOtpDevError] = useState(null)
  const navigate = useNavigate()
  const { register: registerUser, loginWithGoogle } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await registerUser(data)
      if (response.data?.requires_otp) {
        setPendingRegistration(data)
        setOtpCode('')
        setDevOtp(response.data?.dev_otp || null)
        setOtpEmailSent(!!response.data?.email_sent)
        setOtpDevError(response.data?.dev_error || null)
        if (response.data?.email_sent) {
          toast.success('Mã OTP đã được gửi đến email')
        } else {
          toast.error('Chưa gửi được email OTP, đang dùng mã thử nghiệm')
        }
      } else if (response.success) {
        toast.success('Đăng ký thành công')
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  const confirmOtp = async () => {
    if (!pendingRegistration || !/^\d{6}$/.test(otpCode)) {
      toast.error('Nhập mã OTP gồm 6 chữ số')
      return
    }

    setIsLoading(true)
    try {
      const response = await registerUser({ ...pendingRegistration, otp_code: otpCode })
      if (response.success) {
        toast.success('Đăng ký thành công')
        setPendingRegistration(null)
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Mã OTP không đúng hoặc đã hết hạn')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    if (!pendingRegistration) return

    setIsLoading(true)
    try {
      const response = await registerUser(pendingRegistration)
      setDevOtp(response.data?.dev_otp || null)
      setOtpEmailSent(!!response.data?.email_sent)
      setOtpDevError(response.data?.dev_error || null)
      if (response.data?.email_sent) {
        toast.success('Đã gửi lại mã OTP')
      } else {
        toast.error('Chưa gửi được email OTP, đang dùng mã thử nghiệm')
      }
    } catch (error) {
      toast.error(error.message || 'Không thể gửi lại OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = useCallback(async (credential) => {
    setIsLoading(true)
    try {
      const response = await loginWithGoogle(credential)
      if (response.success) {
        toast.success('Đăng nhập Google thành công')
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Đăng nhập Google thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [loginWithGoogle, navigate])

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Tạo tài khoản</h1>
            <p className="text-gray-500">Tham gia cộng đồng yêu sách</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên</label>
                <div className="relative">
                  <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    {...register('first_name', {
                      required: 'Vui lòng nhập tên',
                      minLength: { value: 2, message: 'Tối thiểu 2 ký tự' },
                    })}
                    className="input pr-10"
                    placeholder="Tên"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Họ</label>
                <input
                  type="text"
                  {...register('last_name', {
                    required: 'Vui lòng nhập họ',
                    minLength: { value: 2, message: 'Tối thiểu 2 ký tự' },
                  })}
                  className="input"
                  placeholder="Họ"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                  className="input pr-10"
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Số điện thoại (không bắt buộc)</label>
              <div className="relative">
                <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  {...register('phone', {
                    pattern: {
                      value: /^\+?[\d\s-]{10,}$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  })}
                  className="input pr-10"
                  placeholder="+1234567890"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Vui lòng nhập mật khẩu',
                    minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
                  })}
                  className="input pr-10 pl-10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                {...register('terms', { required: 'Bạn cần đồng ý với điều khoản' })}
                className="rounded text-primary-600 mt-1"
              />
              <span>
                Tôi đồng ý với <Link to="/terms" className="text-primary-600 hover:underline">điều khoản sử dụng</Link>
              </span>
            </label>
            {errors.terms && (
              <p className="text-red-500 text-sm">{errors.terms.message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 disabled:opacity-50"
            >
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm text-gray-500">hoặc</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          <GoogleLoginButton onSuccess={handleGoogleLogin} disabled={isLoading} text="signup_with" />

          <p className="text-center mt-6 text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {pendingRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Xác nhận email</h2>
              <button
                type="button"
                onClick={() => setPendingRegistration(null)}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-white"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-300">
              Nhập mã OTP gồm 6 chữ số đã gửi đến{' '}
              <strong className="text-gray-900 dark:text-white">{pendingRegistration.email}</strong>.
            </p>

            {!otpEmailSent && (
              <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                Email OTP chưa gửi được. Vui lòng kiểm tra cấu hình Gmail SMTP.
                {otpDevError && <div className="mt-1 text-xs">{otpDevError}</div>}
              </div>
            )}

            {devOtp && (
              <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                OTP thử nghiệm: <strong>{devOtp}</strong>
              </div>
            )}

            <input
              className="input mt-4 text-center text-xl tracking-[0.4em]"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
            />

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="btn btn-outline"
                disabled={isLoading}
                onClick={resendOtp}
              >
                Gửi lại OTP
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isLoading}
                onClick={() => setPendingRegistration(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isLoading || otpCode.length < 6}
                onClick={confirmOtp}
              >
                {isLoading ? 'Đang xác minh...' : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Register
