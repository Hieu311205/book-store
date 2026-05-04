import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price)

const Products = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { page, search }],
    queryFn: () => adminService.getProducts({ page, limit: 20, search }),
    select: (res) => res.data,
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Đã xóa sách')
    },
    onError: (error) => toast.error(error.message || 'Xóa thất bại'),
  })

  const handleDelete = (id, title) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý sách</h1>
        <button
          onClick={() => navigate('/products/new')}
          className="btn btn-primary"
        >
          <FiPlus />
          Thêm sách
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sách..."
              className="input pr-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên sách</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
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
              ) : data?.products?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Không có sách
                  </td>
                </tr>
              ) : (
                data?.products?.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="w-12 h-14 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                        <img
                          src={product.images?.[0]?.image_url || '/placeholder.jpg'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.author_name}</p>
                    </td>
                    <td>{product.category_name || '-'}</td>
                    <td>
                      <p>{formatPrice(product.price)} đ</p>
                      {product.compare_price > product.price && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatPrice(product.compare_price)}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className={product.stock < 10 ? 'text-red-500' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {product.is_active ? 'Đang bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/products/${product.id}/edit`)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.title)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t dark:border-gray-700">
            {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded ${
                  page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
