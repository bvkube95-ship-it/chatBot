import "./styles/SignInButton.css"

interface SignInButtonProps {
  onClick: () => void
}

function SignInButton({ onClick }: SignInButtonProps) {
  return (
    <button className="top-signin-btn" onClick={onClick}>
      Sign in
    </button>
  )
}

export default SignInButton