import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiChevronLeft, FiChevronRight, FiFilter, FiLock, FiRefreshCw, FiSearch, FiUnlock, FiUser, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { useAuth } from '../../context/AuthContext'
import PaginationNumbers from '../../components/common/PaginationNumbers'

const roleLabels = {
  super_admin: 'Super admin',
  admin: 'Admin',
  customer: 'Khách hàng',
}

const roleOptions = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super admin' },
]

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'blocked', label: 'Đã khóa' },
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name_asc', label: 'Tên A - Z' },
  { value: 'email_asc', label: 'Email A - Z' },
]

const LIMIT = 20

const Users = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [page, setPage] = useState(1)

  const hasFilters = !!(search || role || status || dateFrom || dateTo)
  const queryParams = {
    page,
    limit: LIMIT,
    search: search || undefined,
    role: role || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', queryParams],
    queryFn: () => adminService.getUsers(queryParams),
    select: (res) => res.data,
  })

  const resetFilters = () => {
    setSearch('')
    setRole('')
    setStatus('')
    setSort('newest')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const blockMutation = useMutation({
    mutationFn: adminService.blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Đã cập nhật trạng thái người dùng')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Đã cập nhật vai trò')
    },
    onError: (error) => toast.error(error.message || 'Có lỗi xảy ra'),
  })

  const canBlock = (target) =>
    target.role !== 'super_admin' && Number(target.id) !== Number(currentUser?.id)

  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.totalItems ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý người dùng</h1>

      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tên, email, SĐT người dùng..."
              className="input pl-9 text-sm"
            />
          </div>

          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1) }}
            className="input w-auto text-sm"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="input w-auto text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="input w-auto text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAdvanced((current) => !current)}
            className={`btn text-sm gap-1.5 ${showAdvanced ? 'btn-primary' : 'btn-outline'}`}
          >
            <FiFilter size={14} /> Nâng cao
          </button>

          <button onClick={() => refetch()} disabled={isFetching} className="btn btn-outline text-sm gap-1.5">
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
          </button>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 font-medium"
            >
              <FiX size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap gap-4 items-end pt-3 border-t dark:border-gray-700">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Ngày tham gia từ</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="input text-sm w-40"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Ngày tham gia đến</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="input text-sm w-40"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
          <span>
            {isFetching ? 'Đang tải...' : `${totalItems} người dùng`}
            {hasFilters && <span className="ml-2 text-primary-600 font-medium">(đang lọc)</span>}
          </span>
          {totalPages > 1 && <span>Trang {page} / {totalPages}</span>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th>Thao tác</th>
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
                    {hasFilters ? 'Không tìm thấy người dùng phù hợp với bộ lọc' : 'Không có người dùng'}
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
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">{roleLabels[user.role]}</p>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Hoạt động' : 'Đã khóa'}
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
                        title={user.is_active ? 'Khóa' : 'Kích hoạt'}
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

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Trang <span className="font-medium text-gray-800 dark:text-gray-100">{page}</span> / {totalPages}
              &nbsp;·&nbsp;{totalItems} người dùng
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(1)} className="btn btn-outline btn-sm px-2" title="Trang đầu">«</button>
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="btn btn-outline btn-sm flex items-center gap-1"
              >
                <FiChevronLeft size={14} /> Trước
              </button>
              <PaginationNumbers page={page} totalPages={totalPages} onPageChange={setPage} />
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="btn btn-outline btn-sm flex items-center gap-1"
              >
                Sau <FiChevronRight size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn btn-outline btn-sm px-2" title="Trang cuối">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users
