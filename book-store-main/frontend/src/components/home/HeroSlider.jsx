import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { Link } from 'react-router-dom'
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
    return null
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
      className="rounded-xl overflow-hidden"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <div className="relative h-[300px] md:h-[400px] bg-gray-900 flex items-center overflow-hidden">
            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.title || ''}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/45" />
            <div className="container mx-auto px-8 relative z-10">
              <div className="max-w-lg text-white">
                {slide.title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{slide.title}</h2>}
                {slide.subtitle && <p className="text-lg text-white/90 mb-6">{slide.subtitle}</p>}
                {slide.link && slide.button_text && (
                  <Link to={slide.link} className="btn bg-white text-gray-900 hover:bg-gray-100">
                    {slide.button_text}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default HeroSlider
