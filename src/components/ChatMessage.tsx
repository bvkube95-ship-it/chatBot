import type { MessageBox } from '../types'
import CodeBlock from './CodeBlock'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import './styles/ChatMessage.css'

function ChatMessage({ message, sender }: MessageBox) {
  return (
    <div className={
        sender === 'user'
        ? 'chat-message-user' 
        : 'chat-message-bot'
      }>
      <div className={`chat-message-text-${sender}`}>
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
    </div>
  )
}

export default ChatMessage