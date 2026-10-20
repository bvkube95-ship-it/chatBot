import { useEffect, useRef, useLayoutEffect } from 'react'
import ChatMessage from './ChatMessage'
import type { MessageBox } from '../types'
import './styles/ChatMessages.css'

interface ChatMessagesProps {
  chatId: string | null
  chatMessages: MessageBox[]
  isBotTyping: boolean
  inputHeight: number
}

const BOTTOM_THRESHOLD = 150

function ChatMessages({ chatId, chatMessages, isBotTyping, inputHeight }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const scrollPositionRef = useRef<Record<string, number>>({})
  const currentChatIdRef = useRef<string | null>(chatId)
  const lastChatIdRef = useRef<string | null>(chatId)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const distanceFromButton =
        container.scrollHeight - container.scrollTop - container.clientHeight

      shouldAutoScrollRef.current = distanceFromButton < BOTTOM_THRESHOLD

      const currentId = currentChatIdRef.current
        if (currentId) {
          scrollPositionRef.current[currentId] = container.scrollTop
        }
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    currentChatIdRef.current = chatId

    const saved = chatId ? scrollPositionRef.current[chatId] : undefined

    container.scrollTop = saved ?? container.scrollHeight

    const distanceFromBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight

    shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD
  }, [chatId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (lastChatIdRef.current !== chatId) {
      lastChatIdRef.current = chatId
      return
    }

    if (shouldAutoScrollRef.current) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        })
    }
  }, [chatMessages, isBotTyping, inputHeight, chatId])

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
          <div className="chat-message-text-bot">
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