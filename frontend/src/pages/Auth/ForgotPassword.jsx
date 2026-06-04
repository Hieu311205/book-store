import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi'
import { authService } from '../../services/auth.service'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [devError, setDevError] = useState(null)

  const sendOtp = async (event) => {
    event?.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(normalizedEmail)) {
      toast.error('Vui lòng nhập email hợp lệ')
      return
    }

    setIsLoading(true)
    try {
      const response = await authService.forgotPassword({ email: normalizedEmail })
      setEmail(normalizedEmail)
      setStep('otp')
      setOtpCode('')
      setEmailSent(!!response.data?.email_sent)
      setDevOtp(response.data?.dev_otp || null)
      setDevError(response.data?.dev_error || null)
      if (response.data?.email_sent) {
        toast.success('Mã OTP đã được gửi đến email')
      } else if (response.data?.dev_otp) {
        toast.error('Chưa gửi được email OTP, đang dùng mã thử nghiệm')
      } else {
        toast.success('Nếu email tồn tại, mã OTP sẽ được gửi đến email này')
      }
    } catch (error) {
      toast.error(error.message || 'Không thể gửi OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()

    if (!/^\d{6}$/.test(otpCode)) {
      toast.error('Mã OTP phải gồm 6 chữ số')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPassword({
        email,
        otp_code: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      toast.success('Đã đổi mật khẩu. Vui lòng đăng nhập lại.')
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Không thể đổi mật khẩu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Quên mật khẩu</h1>
            <p className="text-gray-500">
              {step === 'email'
                ? 'Nhập email tài khoản để nhận mã OTP.'
                : 'Nhập OTP và mật khẩu mới để hoàn tất.'}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input pr-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3 disabled:opacity-50">
                {isLoading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-5">
              <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 text-sm text-primary-800 dark:border-primary-900/60 dark:bg-primary-900/20 dark:text-primary-100">
                Mã OTP đã được tạo cho email <strong>{email}</strong>. Mã có hiệu lực trong 5 phút.
              </div>

              {!emailSent && devError && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  Email OTP chưa gửi được. Vui lòng kiểm tra Gmail SMTP.
                  <div className="mt-1 text-xs">{devError}</div>
                </div>
              )}

              {devOtp && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                  OTP thử nghiệm: <strong>{devOtp}</strong>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Mã OTP</label>
                <div className="relative">
                  <FiShield className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pr-10 text-center text-lg tracking-[0.3em]"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10 pl-10"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="********"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="btn btn-outline" disabled={isLoading} onClick={sendOtp}>
                  Gửi lại OTP
                </button>
                <button type="button" className="btn btn-secondary" disabled={isLoading} onClick={() => setStep('email')}>
                  Đổi email
                </button>
                <button type="submit" disabled={isLoading} className="btn btn-primary disabled:opacity-50">
                  {isLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-gray-500">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
