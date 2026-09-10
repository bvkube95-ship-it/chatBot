import type { MessageBox } from '../types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import bot from '../assets/robot.png'
import user from '../assets/user.png'
import './styles/ChatMessage.css'

function ChatMessage({ message, sender }: MessageBox) {
  console.log('RAW:', JSON.stringify(message));
  return (
    <div className={
        sender === 'user'
        ? 'chat-message-user' 
        : 'chat-message-bot'
      }>
      {sender === 'bot' && <img src={bot} className="chat-message-profile" />}
      <div className="chat-message-text">
        {sender === 'bot' ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
          >{message}</ReactMarkdown>
        ) : (
          message
        )}
      </div>  
      {sender === 'user' && <img src={user} className="chat-message-profile" />}
    </div>
  )
}

export default ChatMessage