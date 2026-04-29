import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiUser, FiLock, FiUnlock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { useAuth } from '../../context/AuthContext'

const roleLabels = {
  super_admin: 'Super admin',
  admin: 'Admin',
  customer: 'Khach hang',
}

const Users = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () => adminService.getUsers({ page, limit: 20, search }),
    select: (res) => res.data,
  })

  const blockMutation = useMutation({
    mutationFn: adminService.blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Da cap nhat trang thai nguoi dung')
    },
    onError: (error) => toast.error(error.message || 'Co loi xay ra'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Da cap nhat vai tro')
    },
    onError: (error) => toast.error(error.message || 'Co loi xay ra'),
  })

  const canBlock = (target) =>
    target.role !== 'super_admin' && Number(target.id) !== Number(currentUser?.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quan ly nguoi dung</h1>

      <div className="card p-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tim nguoi dung..."
            className="input pr-10"
          />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nguoi dung</th>
                <th>Email</th>
                <th>So dien thoai</th>
                <th>Vai tro</th>
                <th>Trang thai</th>
                <th>Ngay tham gia</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Khong co nguoi dung
                  </td>
                </tr>
              ) : (
                data?.users?.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <FiUser className="text-primary-600" size={14} />
                        </div>
                        <span>{user.first_name} {user.last_name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <select
                        value={user.role}
                        disabled={Number(user.id) === Number(currentUser?.id)}
                        onChange={(event) => roleMutation.mutate({ id: user.id, role: event.target.value })}
                        className="text-sm border rounded px-2 py-1 bg-transparent disabled:opacity-60"
                      >
                        <option value="customer">Khach hang</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">{roleLabels[user.role]}</p>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Hoat dong' : 'Da khoa'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <button
                        onClick={() => blockMutation.mutate(user.id)}
                        disabled={!canBlock(user)}
                        className={`p-2 rounded disabled:opacity-40 disabled:cursor-not-allowed ${
                          user.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'
                        }`}
                        title={user.is_active ? 'Khoa' : 'Kich hoat'}
                      >
                        {user.is_active ? <FiLock size={16} /> : <FiUnlock size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users
