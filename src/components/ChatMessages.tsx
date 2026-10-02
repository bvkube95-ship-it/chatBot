import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'
import type { MessageBox } from '../types'
import './styles/ChatMessages.css'

interface ChatMessagesProps {
  chatMessages: MessageBox[]
  isBotTyping: boolean
}

function ChatMessages({ chatMessages, isBotTyping }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const distanceFromButton =
        container.scrollHeight - container.scrollTop - container.clientHeight

      shouldAutoScrollRef.current = distanceFromButton < 150
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (shouldAutoScrollRef.current) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        })
    }
  }, [chatMessages, isBotTyping])

  return (
    <div 
      className="chat-messages-container"
      ref={containerRef}
    >
      <div className="chat-messages-inner">
      {chatMessages.map(({ message, sender, id }) => (
        <ChatMessage
          key={id}
          message={message}
          sender={sender}
          id={id}
        />
      ))}
      {isBotTyping && (
        <div className="chat-message-bot">
          <div className="chat-message-text">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ChatMessages