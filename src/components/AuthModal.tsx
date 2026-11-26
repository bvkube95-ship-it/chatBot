import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { sendMagicLink } from '../utils/authApi'
import "./styles/Modal.css"
import "./styles/AuthModal.css"

interface AuthModalProps {
  onClose: () => void
}

type Status = "idle" | "sending" | "sent"

function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  // close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function continueWithGoogle() {
    // Full page navigation: Google needs the whole window, not a fetch
    window.location.href = '/auth/google'
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setError('')

    try {
      await sendMagicLink(email.trim())
      setStatus('sent')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
      setStatus('idle')
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'sent' ? (
          <div className="auth-sent">
            <h2 id="modal-title" className="modal-title">Check your email</h2>
            <p className="modal-text">
              We sent a sign-in link to <strong>{email}</strong>. It works for 15 minutes.
            </p>
            <p className="auth-hint">Can't find it? Check your Spam folder.</p>
            <button
              className="modal-btn-secondary"
              onClick={() => setStatus('idle')}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 id="modal-title" className="modal-title">Sign in to NYX Assist</h2>
            <p className="modal-text">Continue with Google or get a link by email.</p>

            <button className="modal-btn-secondary" onClick={continueWithGoogle}>
              <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider"><span>or</span></div>

            <form onSubmit={handleSubmit}>
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button
                className="modal-btn-primary"
                type="submit"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Continue with email'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthModal