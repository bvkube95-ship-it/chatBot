import { useEffect } from 'react'

const MESSAGES: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  invalid_state: 'The sign-in session expired. Please try again.',
  google_failed: 'Google sign-in failed. Please try again.',
  email_not_verified: 'Your Google email is not verified.',
  invalid_link: 'This sign-in link is invalid or has expired. Request a new one.',
}

function useAuthError(showToast: (message: string) => void) {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('auth_error')
    if (!code) return

    showToast(MESSAGES[code] ?? 'Sign-in failed. Please try again')

    // Remove ?auth_error from the address so a reload doesn't repeat the message.
    // It's on a timer so StrictMode's second effect run in dev still sees the param.
    const timer = setTimeout(() => {
      window.history.replaceState(null, '', window.location.pathname)
    }, 0)

    return () => clearTimeout(timer)
  }, [showToast])
}

export default useAuthError