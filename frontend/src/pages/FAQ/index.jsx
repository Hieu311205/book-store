const faqs = [
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
    answer: 'Giao hàng tiêu chuẩn thường mất 2-5 ngày tùy khu vực. Giao nhanh có thể rút ngắn thời gian nhận hàng.',
  },
  {
    question: 'Tôi có thể hủy đơn hàng không?',
    answer: 'Bạn có thể hủy đơn khi đơn còn ở trạng thái chờ xử lý hoặc đã thanh toán nhưng chưa chuyển sang xử lý giao hàng.',
  },
  {
    question: 'Sách bị lỗi có đổi trả được không?',
    answer: 'Bạn có thể liên hệ cửa hàng để được hỗ trợ đổi trả nếu sách bị lỗi in ấn, hư hỏng khi vận chuyển hoặc giao sai sản phẩm.',
  },
]

const FAQ = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-6">
      <h1 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h1>
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
