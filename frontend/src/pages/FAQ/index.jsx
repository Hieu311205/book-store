import { useQuery } from '@tanstack/react-query'
import { getSupportFaq } from '../../services/aiApi'

const fallbackFaqs = [
  {
    question: 'Làm sao để đặt hàng?',
    answer: 'Bạn chọn sách, thêm vào giỏ hàng, vào trang thanh toán, chọn địa chỉ giao hàng và xác nhận đơn hàng.',
  },
  {
    question: 'Có thể dùng mã giảm giá ở đâu?',
    answer: 'Mã giảm giá được chọn ở trang thanh toán nếu mã còn hiệu lực và đơn hàng đạt điều kiện tối thiểu.',
  },
  {
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'Thời gian giao hàng dự kiến được tính từ lúc shop nhập thông tin vận chuyển.',
  },
]

const FAQ = () => {
  const { data: aiFaqs = [], isLoading, error } = useQuery({
    queryKey: ['ai-support-faq'],
    queryFn: () => getSupportFaq(),
    staleTime: 10 * 60 * 1000,
  })

  const faqs = aiFaqs.length ? aiFaqs : fallbackFaqs

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-2">hỗ trợ</p>
        <h1 className="text-2xl font-bold">Câu hỏi thường gặp</h1>
        {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải dữ liệu từ AI service...</p>}
        {error && <p className="text-sm text-yellow-500 mt-2">Python AI service chưa chạy, đang dùng dữ liệu dự phòng.</p>}
      </div>

      <div className="space-y-4">
        {faqs.map((item) => (
          <section key={item.question} className="border dark:border-gray-700 rounded-lg p-4">
            <h2 className="font-semibold mb-2">{item.question}</h2>
            <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

export default FAQ
