import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'
import type { ChatMessagesProps } from '../types'
import bot from '../assets/robot.png'
import loadingCircle from '../assets/loading-spinner.gif'
import './styles/ChatMessages.css'

function ChatMessages({ chatMessages, isBotTyping }: ChatMessagesProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElem = chatMessagesRef.current
    if (containerElem) {
      containerElem.scrollTop = containerElem.scrollHeight
    }
  }, [chatMessages, isBotTyping])

  return (
    <div 
      className="chat-messages-container"
      ref={chatMessagesRef}
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
          <img src={bot} className="chat-message-profile" />
          <div className="chat-message-text">
            <img src={loadingCircle} className="chat-loading-circle" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatMessages