import { useState, useEffect } from 'react'
import { FiArrowUp } from 'react-icons/fi'

const BackToTop = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 450)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Lên đầu trang"
      className={`store-back-to-top${visible ? ' is-visible' : ''}`}
    >
      <FiArrowUp size={20} />
    </button>
  )
}

export default BackToTop
