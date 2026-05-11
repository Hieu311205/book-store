import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { useQuery } from '@tanstack/react-query'
import { sliderService } from '../../services/slider.service'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const HeroSlider = () => {
  const { data: slides = [] } = useQuery({
    queryKey: ['home-sliders'],
    queryFn: sliderService.getSliders,
    select: (res) => res.data || [],
  })

  if (!slides.length) {
    return (
      <section className="store-hero-fallback">
        <div>
          <span className="store-hero-kicker">Nhà sách trực tuyến</span>
          <h1>Chọn sách hay cho những ngày muốn đọc thật sâu</h1>
          <p>Khám phá sách mới, sách bán chạy và các tủ sách được tuyển chọn cho bạn.</p>
          <Link to="/products" className="store-hero-button">
            Mua sách ngay
          </Link>
        </div>
      </section>
    )
  }

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={0}
      slidesPerView={1}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      loop={slides.length > 1}
      className="store-hero-slider"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <section className="store-hero-slide">
            {slide.image_url && <img src={slide.image_url} alt={slide.title || ''} />}
            <div className="store-hero-overlay" />
            <div className="store-hero-content">
              <span className="store-hero-kicker">Book Store</span>
              {slide.title && <h1>{slide.title}</h1>}
              {slide.subtitle && <p>{slide.subtitle}</p>}
              {slide.link && slide.button_text && (
                <Link to={slide.link} className="store-hero-button">
                  {slide.button_text}
                </Link>
              )}
            </div>
          </section>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default HeroSlider
