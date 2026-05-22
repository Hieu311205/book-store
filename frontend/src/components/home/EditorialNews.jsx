import { Link } from 'react-router-dom'
import { FiCalendar, FiFileText } from 'react-icons/fi'

const articles = [
  {
    title: 'Gợi ý sách cho cuối tuần',
    description: 'Những đầu sách nhẹ nhàng, dễ đọc để làm mới cảm hứng sau một tuần bận rộn.',
    tag: 'Độc giả review',
  },
  {
    title: 'Cách chọn sách phù hợp với mục tiêu đọc',
    description: 'Từ văn học đến kỹ năng, hãy bắt đầu bằng nhu cầu thật sự của bạn.',
    tag: 'Biên tập giới thiệu',
  },
  {
    title: 'Không gian đọc sách tại nhà',
    description: 'Một vài gợi ý nhỏ để kệ sách trở thành góc thư giãn quen thuộc.',
    tag: 'Tin sách',
  },
]

const EditorialNews = () => {
  return (
    <section className="store-editorial-section">
      <div className="store-section-top">
        <div className="store-section-heading">
          <span className="store-section-kicker">Trang tin sách</span>
          <h2>Câu chuyện quanh những trang sách</h2>
        </div>
        <Link to="/products" className="store-view-all">Xem thêm sách</Link>
      </div>

      <div className="store-editorial-grid">
        {articles.map((article) => (
          <article className="store-editorial-card" key={article.title}>
            <span className="store-editorial-icon"><FiFileText /></span>
            <div>
              <span className="store-editorial-tag">{article.tag}</span>
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <small><FiCalendar /> Cập nhật hôm nay</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default EditorialNews
