import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../product/ProductCard';

const fetchRecommendations = async (token, userId) => {
  const response = await fetch(`/ai/recommendations/user/?user_id=${userId}&limit=6`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Không thể tải gợi ý');
  const data = await response.json();
  return data.data || [];
};

const Recommendations = () => {
  const { user, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  const { data: products = [], isLoading, error } = useQuery({
  queryKey: ['recommendations', user?.id],
  queryFn: () => fetchRecommendations(token, user?.id),
  enabled: isAuthenticated && !!token && !!user?.id,
  staleTime: 5 * 60 * 1000,
});

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="text-center py-8">Đang tải gợi ý...</div>;
  if (error) {
    console.error('Lỗi gợi ý:', error);
    return null;
  }
  if (!products.length) return null;

  return (
    <section className="store-section">
      <div className="store-section-heading">
        <span className="store-section-kicker">Dành riêng cho bạn</span>
        <h2>Có thể bạn sẽ thích</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default Recommendations;