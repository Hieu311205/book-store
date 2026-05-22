import { Link } from 'react-router-dom'
import { FiInstagram, FiMail, FiMapPin, FiPhone, FiTwitter } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { settingsService } from '../../services/settings.service'

const Footer = () => {
  const { data: settings = {} } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data || {},
  })

  return (
    <footer className="store-footer">
      <div className="store-footer-inner container mx-auto px-4">
        <div className="store-footer-grid">
          <div>
            <h3>{settings.site_name || 'Book Store'}</h3>
            <p>{settings.site_description || 'Không gian mua sách trực tuyến dành cho độc giả yêu sách.'}</p>
            <div className="store-footer-social">
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <FiInstagram />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <FiTwitter />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3>Liên kết</h3>
            <ul>
              <li><Link to="/products">Tất cả sách</Link></li>
              <li><Link to="/products?bestseller=true">Bán chạy</Link></li>
              <li><Link to="/products?featured=true">Nổi bật</Link></li>
              <li><Link to="/products?sort=newest">Mới nhất</Link></li>
            </ul>
          </div>

          <div>
            <h3>Hỗ trợ</h3>
            <ul>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
              <li><Link to="/shipping">Giao hàng</Link></li>
              <li><Link to="/returns">Đổi trả</Link></li>
            </ul>
          </div>

          <div>
            <h3>Liên hệ</h3>
            <ul className="store-contact-list">
              <li>
                <FiMail />
                <Link to="/contact">Liên hệ</Link>
              </li>
              {settings.contact_phone && (
                <li>
                  <FiPhone />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <FiMail />
                  <span>{settings.contact_email}</span>
                </li>
              )}
              {settings.contact_address && (
                <li>
                  <FiMapPin />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="store-footer-bottom">
          <p>{settings.copyright_text || '© Book Store. Tất cả quyền được bảo lưu.'}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
