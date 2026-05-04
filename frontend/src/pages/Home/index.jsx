import { useQuery } from '@tanstack/react-query'
import HeroSlider from '../../components/home/HeroSlider'
import CategoryGrid from '../../components/home/CategoryGrid'
import ProductSection from '../../components/home/ProductSection'
import { productService } from '../../services/product.service'

const Home = () => {
  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeaturedProducts(8),
    select: (res) => res.data,
  })

  const { data: bestsellers, isLoading: loadingBestsellers } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => productService.getBestsellers(8),
    select: (res) => res.data,
  })

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productService.getNewArrivals(8),
    select: (res) => res.data,
  })

  return (
    <div>
      <section className="mb-8">
        <HeroSlider />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
          <span className="text-2xl">Nhanh</span>
          <div>
            <p className="font-medium text-sm">Giao hàng nhanh</p>
            <p className="text-xs text-gray-500">Giao hàng toàn quốc</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
          <span className="text-2xl">An toàn</span>
          <div>
            <p className="font-medium text-sm">Thanh toán bảo mật</p>
            <p className="text-xs text-gray-500">Quy trình an toàn</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
          <span className="text-2xl">Đổi trả</span>
          <div>
            <p className="font-medium text-sm">Đổi trả dễ dàng</p>
            <p className="text-xs text-gray-500">Trong 7 ngày</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
          <span className="text-2xl">Hỗ trợ</span>
          <div>
            <p className="font-medium text-sm">Hỗ trợ 24/7</p>
            <p className="text-xs text-gray-500">Luôn sẵn sàng</p>
          </div>
        </div>
      </section>

      <CategoryGrid />

      <ProductSection
        title="Sách nổi bật"
        products={featured}
        isLoading={loadingFeatured}
        link="/products?featured=true"
      />

      <section className="my-10 bg-gradient-to-l from-primary-600 to-primary-800 rounded-xl p-8 text-white">
        <div className="max-w-2xl">
          <h3 className="text-2xl font-bold mb-2">Ưu đãi sách tâm lý</h3>
          <p className="mb-4 text-white/90">Giảm đến 30% cho các sách tâm lý và phát triển bản thân</p>
          <a href="/products?category=2" className="btn bg-white text-primary-700 hover:bg-gray-100">
            Xem ưu đãi
          </a>
        </div>
      </section>

      <ProductSection
        title="Sách bán chạy"
        products={bestsellers}
        isLoading={loadingBestsellers}
        link="/products?bestseller=true"
      />

      <ProductSection
        title="Sách mới"
        products={newArrivals}
        isLoading={loadingNew}
        link="/products?sort=newest"
      />
    </div>
  )
}

export default Home
