import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Đăng nhập thành công')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Trang quản trị</h1>
            <p className="text-gray-500">Đăng nhập bằng tài khoản admin trong database</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { required: 'Vui lòng nhập email' })}
                  className="input pr-10"
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mật khẩu</label>
              <div className="relative">
                <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  className="input pr-10 pl-10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3">
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
