import type { MessageBox } from '../types'
import bot from '../assets/robot.png'
import user from '../assets/user.png'
import './styles/ChatMessage.css'

function ChatMessage({ message, sender }: MessageBox) {
  return (
    <div className={
        sender === 'user'
        ? 'chat-message-user' 
        : 'chat-message-bot'
      }>
      {sender === 'bot' && <img src={bot} className="chat-message-profile" />}
      <div className="chat-message-text">
        {message}
      </div>  
      {sender === 'user' && <img src={user} className="chat-message-profile" />}
    </div>
  )
}

export default ChatMessage