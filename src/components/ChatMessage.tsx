import { memo } from 'react'
import type { Components } from 'react-markdown'
import type { MessageBox } from '../types'
import CodeBlock from './CodeBlock'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './styles/ChatMessage.css'

const REMARK_PLUGINS = [remarkGfm]

const MARKDOWN_COMPONENTS: Components = {
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const text = String(children)
    const isInLine = !className && !text.includes('\n')

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
        code={text.replace(/\n$/, '')}
      />
    )
  },
}

const ChatMessage = memo(function ChatMessage({ message, sender, id }: MessageBox) {
  return (
    <div
      data-message-id={id}
      className={sender === 'user' ? 'chat-message-user' : 'chat-message-bot'}
    >
      <div className={`chat-message-text-${sender}`}>
        {sender === 'bot' ? (
          <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            components={MARKDOWN_COMPONENTS}
          >
            {message}
          </ReactMarkdown>
        ) : (
          message
        )}
      </div>
    </div>
  )
})

export default ChatMessage