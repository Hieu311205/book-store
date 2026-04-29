import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiInstagram, FiTwitter, FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import { settingsService } from '../../services/settings.service'

const Footer = () => {
  const { data: settings = {} } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data || {},
  })

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            {settings.site_name && <h3 className="text-white font-bold text-lg mb-4">{settings.site_name}</h3>}
            {settings.site_description && (
              <p className="text-gray-400 text-sm leading-relaxed">{settings.site_description}</p>
            )}
            <div className="flex gap-4 mt-4">
              {settings.instagram_url && (
                <a href={settings.instagram_url} className="hover:text-primary-500" target="_blank" rel="noreferrer">
                  <FiInstagram size={20} />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} className="hover:text-primary-500" target="_blank" rel="noreferrer">
                  <FiTwitter size={20} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Lien ket</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-primary-500">Tat ca sach</Link></li>
              <li><Link to="/products?bestseller=true" className="hover:text-primary-500">Ban chay</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-primary-500">Noi bat</Link></li>
              <li><Link to="/products?sort=newest" className="hover:text-primary-500">Moi nhat</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Ho tro</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-primary-500">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-primary-500">Giao hang</Link></li>
              <li><Link to="/returns" className="hover:text-primary-500">Doi tra</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500">Lien he</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Lien he</h3>
            <ul className="space-y-3 text-sm">
              {settings.contact_phone && (
                <li className="flex items-center gap-2">
                  <FiPhone className="text-primary-500" />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-center gap-2">
                  <FiMail className="text-primary-500" />
                  <span>{settings.contact_email}</span>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2">
                  <FiMapPin className="text-primary-500 mt-1" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {settings.copyright_text && (
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>{settings.copyright_text}</p>
          </div>
        )}
      </div>
    </footer>
  )
}

export default Footer
