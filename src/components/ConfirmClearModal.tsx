import { useEffect } from 'react'
import './styles/Modal.css'

interface ConfirmClearModalProps {
  onClose: () => void
  onClear: () => void
  onSignIn: () => void
}

function ConfirmClearModal({ onClose, onClear, onSignIn }: ConfirmClearModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="clear-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 id="clear-title" className="modal-title">Clear this chat?</h2>
        <p className="modal-text">
          Without an account you can have only one chat. Clear it to start a new one,
          or sign in to keep several chats.
        </p>

        <div className="modal-actions">
          <button className="modal-btn-primary" onClick={onSignIn}>Sign in</button>
          <button className="modal-btn-secondary" onClick={onClear}>Clear chat</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmClearModal