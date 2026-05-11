import { useQuery } from '@tanstack/react-query'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import { settingsService } from '../../services/settings.service'

const defaultContact = {
  phone: '1900 636467',
  email: 'hotro@bookstore.vn',
  address: 'Nhà sách FAHASA Nguyễn Huệ, 40 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
}

const Contact = () => {
  const { data: settings = {} } = useQuery({
    queryKey: ['public-settings'],
    queryFn: settingsService.getSettings,
    select: (res) => res.data || {},
  })

  const phone = settings.contact_phone || defaultContact.phone
  const email = settings.contact_email || defaultContact.email
  const address = settings.contact_address || defaultContact.address
  const mapQuery = encodeURIComponent(address)

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Liên hệ</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Book Store luôn sẵn sàng hỗ trợ bạn về đơn hàng, giao hàng, đổi trả và tư vấn sách.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <FiPhone className="text-primary-600 mb-3" size={22} />
          <h2 className="font-semibold mb-1">Hotline</h2>
          <a className="text-gray-600 dark:text-gray-300 hover:text-primary-600" href={`tel:${phone.replace(/\s/g, '')}`}>
            {phone}
          </a>
        </div>
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <FiMail className="text-primary-600 mb-3" size={22} />
          <h2 className="font-semibold mb-1">Email</h2>
          <a className="text-gray-600 dark:text-gray-300 hover:text-primary-600" href={`mailto:${email}`}>
            {email}
          </a>
        </div>
        <div className="border dark:border-gray-700 rounded-lg p-4">
          <FiMapPin className="text-primary-600 mb-3" size={22} />
          <h2 className="font-semibold mb-1">Địa chỉ</h2>
          <p className="text-gray-600 dark:text-gray-300">{address}</p>
        </div>
      </div>

      <div className="border dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h2 className="font-semibold">Hệ thống cửa hàng</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{address}</p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
          >
            Mở bản đồ
          </a>
        </div>
        <iframe
          title="Bản đồ cửa hàng Book Store"
          src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
          className="w-full h-80 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}

export default Contact
