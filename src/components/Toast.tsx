import './styles/Toast.css'

interface ToastProps {
  message: string
  onDone: () => void
}

function Toast({ message, onDone }: ToastProps) {
  return (
    <div className='toast' role='status' onAnimationEnd={onDone} >
      {message}
    </div>
  )
}

export default Toast