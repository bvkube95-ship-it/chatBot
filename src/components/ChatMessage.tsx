import type { MessageBox } from '../types'
import CodeBlock from './CodeBlock'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const isInLine = !className

                if (isInLine) {
                  return (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  )
                }

                return (
                  <CodeBlock
                    language={match ? match[1] : ''}
                    code={String(children).replace(/\n$/, '')}
                  />
                )
              }
            }}
          >{message}
          </ReactMarkdown>
        ) : (
          message
        )}
      </div>  
      {sender === 'user' && <img src={user} className="chat-message-profile" />}
    </div>
  )
}

export default ChatMessage