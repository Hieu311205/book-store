import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getUserRecommendations } from '../../services/aiApi'
import ProductCard from '../product/ProductCard'

const Recommendations = () => {
  const { user, isAuthenticated } = useAuth()
  const token = localStorage.getItem('token')

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: () => getUserRecommendations({ token, userId: user.id, limit: 6 }),
    enabled: isAuthenticated && !!token && !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!isAuthenticated) return null
  if (isLoading) return <div className="text-center py-8">Đang tải gợi ý...</div>
  if (error) {
    console.error('Lỗi gợi ý:', error)
    return null
  }
  if (!products.length) return null

  return (
    <section className="store-section">
      <div className="store-section-heading">

        <h2>Có thể bạn sẽ thích</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default Recommendations
