import { FiBookOpen, FiHeadphones, FiRefreshCw, FiTruck } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import HeroSlider from '../../components/home/HeroSlider'
import CategoryGrid from '../../components/home/CategoryGrid'
import ProductSection from '../../components/home/ProductSection'
import PopularSearches from '../../components/home/PopularSearches'
import RankingSection from '../../components/home/RankingSection'
import EditorialNews from '../../components/home/EditorialNews'
import ComboSpotlight from '../../components/home/ComboSpotlight'
import { productService } from '../../services/product.service'

const benefits = [
  {
    icon: <FiBookOpen />,
    title: 'Sách chọn lọc',
    description: 'Tuyển chọn đầu sách hay cho mọi độ tuổi',
  },
  {
    icon: <FiTruck />,
    title: 'Giao hàng toàn quốc',
    description: 'Đóng gói cẩn thận, giao nhanh đến tận nhà',
  },
  {
    icon: <FiRefreshCw />,
    title: 'Đổi trả dễ dàng',
    description: 'Hỗ trợ đổi trả trong 7 ngày',
  },
  {
    icon: <FiHeadphones />,
    title: 'Tư vấn tận tâm',
    description: 'Gợi ý sách phù hợp với nhu cầu đọc',
  },
]

const Home = () => {
  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeaturedProducts(8),
    select: (res) => res.data,
  })

  const { data: bestsellers, isLoading: loadingBestsellers } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => productService.getBestsellers(10),
    select: (res) => res.data,
  })

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productService.getNewArrivals(8),
    select: (res) => res.data,
  })

  return (
    <div className="store-home">
      <HeroSlider />

      <section className="store-benefits" aria-label="Cam kết dịch vụ">
        {benefits.map((item) => (
          <div className="store-benefit" key={item.title}>
            <span className="store-benefit-icon">{item.icon}</span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
          </div>
        ))}
      </section>

      <PopularSearches />
      <CategoryGrid />

      <ProductSection
        eyebrow="Vừa lên kệ"
        title="Sách mới phát hành"
        products={newArrivals}
        isLoading={loadingNew}
        link="/products?sort=newest"
      />

      <RankingSection products={bestsellers || []} isLoading={loadingBestsellers} />

      <ProductSection
        eyebrow="Gợi ý hôm nay"
        title="Sách nổi bật"
        products={featured}
        isLoading={loadingFeatured}
        link="/products?featured=true"
      />

      <section className="store-promo-banner">
        <div>
          <span className="store-promo-kicker">Ưu đãi theo chủ đề</span>
          <h2>Thêm sách hay vào kệ đọc của bạn</h2>
          <p>Khám phá các đầu sách văn học, kỹ năng và thiếu nhi đang được độc giả quan tâm.</p>
        </div>
        <a href="/products" className="store-promo-button">
          Xem ưu đãi
        </a>
      </section>

      <ProductSection
        eyebrow="Được mua nhiều"
        title="Sách bán chạy"
        products={bestsellers}
        isLoading={loadingBestsellers}
        link="/products?bestseller=true"
      />

      <ComboSpotlight products={featured || []} isLoading={loadingFeatured} />
      <EditorialNews />
    </div>
  )
}

export default Home
