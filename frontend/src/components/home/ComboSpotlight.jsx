import ProductCard from '../product/ProductCard'

const ComboSpotlight = ({ products = [], isLoading }) => {
  const comboProducts = products.slice(0, 4)

  return (
    <section className="store-combo-section">
      <div className="store-combo-copy">
        <span className="store-section-kicker">Combo ưu đãi</span>
        <h2>Gom sách cùng chủ đề, đọc liền một mạch</h2>
        <p>Chọn các đầu sách đang nổi bật để tạo kệ đọc theo tác giả, thể loại hoặc thói quen đọc của bạn.</p>
      </div>

      <div className="store-combo-grid">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <div className="store-category-skeleton" key={index} />)
          : comboProducts.map((product) => <ProductCard product={product} key={product.id} />)}
      </div>
    </section>
  )
}

export default ComboSpotlight
