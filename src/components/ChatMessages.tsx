import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'
import type { ChatMessagesProps } from '../utils/types'
import './styles/ChatMessages.css'

function ChatMessages({ chatMessages, isBotTyping }: ChatMessagesProps) {
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
      const handleScroll = () => {
          const distanceFromBottom =
              document.documentElement.scrollHeight -
              window.scrollY -
              window.innerHeight

          shouldAutoScrollRef.current = distanceFromBottom < 150
      }

      window.addEventListener('scroll', handleScroll)

      return () => {
          window.removeEventListener('scroll', handleScroll)
      }
  }, [])

  useEffect(() => {
      if (shouldAutoScrollRef.current) {
          window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth'
          })
      }
  }, [chatMessages, isBotTyping])

  return (
    <div 
      className="chat-messages-container"
    >
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
  )
}

export default ChatMessages