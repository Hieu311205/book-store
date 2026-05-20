import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

const GOOGLE_SCRIPT_ID = 'google-identity-services'

const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve()
    return
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
  if (existingScript) {
    existingScript.addEventListener('load', resolve, { once: true })
    existingScript.addEventListener('error', reject, { once: true })
    return
  }

  const script = document.createElement('script')
  script.id = GOOGLE_SCRIPT_ID
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = resolve
  script.onerror = reject
  document.head.appendChild(script)
})

const GoogleLoginButton = ({ onSuccess, disabled = false, text = 'continue_with' }) => {
  const buttonRef = useRef(null)
  const [ready, setReady] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onSuccess(response.credential)
            } else {
              toast.error('Không thể nhận thông tin từ Google')
            }
          },
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text,
          width: buttonRef.current.offsetWidth || 360,
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) toast.error('Không thể tải đăng nhập Google')
      })

    return () => {
      cancelled = true
    }
  }, [clientId, onSuccess, text])

  if (!clientId) {
    return (
      <button type="button" disabled className="btn btn-outline w-full opacity-60">
        Chưa cấu hình Google OAuth
      </button>
    )
  }

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={buttonRef} className="w-full min-h-[44px]" />
      {!ready && <button type="button" disabled className="btn btn-outline w-full">Đang tải Google...</button>}
    </div>
  )
}

export default GoogleLoginButton
