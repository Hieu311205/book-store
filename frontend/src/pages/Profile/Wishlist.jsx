import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FiTrash2 } from 'react-icons/fi'
import { userService } from '../../services/user.service'
import { formatPrice } from '../../utils/formatPrice'

const Wishlist = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: userService.getWishlist,
    select: (res) => res.data,
  })

  const removeMutation = useMutation({
    mutationFn: userService.removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist'])
      toast.success('Da xoa khoi yeu thich')
    },
    onError: (error) => toast.error(error.message || 'Khong the xoa'),
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Danh sach yeu thich</h2>
      {isLoading ? (
        <p className="text-gray-500">Dang tai...</p>
      ) : data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item) => (
            <div key={item.id} className="flex gap-3 border dark:border-gray-700 rounded-lg p-3">
              <img
                src={item.image_url || '/images/placeholder-book.jpg'}
                alt={item.title}
                className="w-16 h-20 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`} className="font-medium hover:text-primary-600 line-clamp-2">
                  {item.title}
                </Link>
                <p className="text-primary-600 font-semibold mt-1">{formatPrice(item.price)}</p>
              </div>
              <button
                onClick={() => removeMutation.mutate(item.product_id)}
                className="text-red-500 hover:text-red-600"
                title="Xoa"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Danh sach dang trong</p>
      )}
    </div>
  )
}

export default Wishlist
