import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const redirect = searchParams.get('redirect') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await login(data.email, data.password)
      if (response.success) {
        toast.success('Dang nhap thanh cong')
        navigate(redirect)
      }
    } catch (error) {
      toast.error(error.message || 'Dang nhap that bai')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Dang nhap tai khoan</h1>
            <p className="text-gray-500">Nhap tai khoan da tao trong database</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Vui long nhap email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email khong hop le',
                    },
                  })}
                  className="input pr-10"
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mat khau</label>
              <div className="relative">
                <FiLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Vui long nhap mat khau' })}
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
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-primary-600" />
                <span>Ghi nho dang nhap</span>
              </label>
              <Link to="/forgot-password" className="text-primary-600 hover:underline">
                Quen mat khau?
              </Link>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3 disabled:opacity-50">
              {isLoading ? 'Dang dang nhap...' : 'Dang nhap'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            Chua co tai khoan?{' '}
            <Link to="/register" className="text-primary-600 hover:underline">
              Dang ky
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
