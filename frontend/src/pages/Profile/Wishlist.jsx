import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiBell, FiBellOff, FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { userService } from '../../services/user.service'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatPrice'

const Wishlist = () => {
  const queryClient = useQueryClient()
  const { addToCart } = useCart()

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: userService.getWishlist,
    select: (res) => res.data,
  })

  const removeMutation = useMutation({
    mutationFn: userService.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Đã xóa khỏi yêu thích')
    },
    onError: (error) => toast.error(error.message || 'Không thể xóa'),
  })

  const notifyMutation = useMutation({
    mutationFn: userService.toggleWishlistNotify,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success(res.data?.message || 'Đã cập nhật thông báo')
    },
    onError: (error) => toast.error(error.message || 'Không thể cập nhật'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Danh sách yêu thích</h2>
      {isLoading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item) => (
            <div key={item.id} className="flex gap-3 border dark:border-gray-700 rounded-lg p-3">
              <img
                src={item.image_url || '/images/placeholder-book.jpg'}
                alt={item.title}
                className="w-16 h-20 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`} className="font-medium hover:text-primary-600 line-clamp-2 text-sm">
                  {item.title}
                </Link>
                <p className="text-primary-600 font-semibold mt-1 text-sm">{formatPrice(item.price)} đ</p>
                {item.stock === 0 && (
                  <span className="text-xs text-red-500 mt-0.5 block">Hết hàng</span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {item.stock > 0 && (
                  <button
                    onClick={() => { addToCart(item.product_id, 1); toast.success('Đã thêm vào giỏ') }}
                    className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Thêm vào giỏ hàng"
                  >
                    <FiShoppingCart size={15} />
                  </button>
                )}
                {item.stock === 0 && (
                  <button
                    onClick={() => notifyMutation.mutate(item.product_id)}
                    disabled={notifyMutation.isPending}
                    className={`p-1.5 rounded transition-colors ${
                      item.notify_when_available
                        ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    }`}
                    title={item.notify_when_available ? 'Tắt thông báo khi có hàng' : 'Thông báo khi có hàng'}
                  >
                    {item.notify_when_available ? <FiBell size={15} /> : <FiBellOff size={15} />}
                  </button>
                )}
                <button
                  onClick={() => removeMutation.mutate(item.product_id)}
                  disabled={removeMutation.isPending}
                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Xóa"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Danh sách đang trống</p>
      )}
    </div>
  )
}

export default Wishlist
