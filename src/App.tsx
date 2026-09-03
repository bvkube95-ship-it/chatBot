import { useEffect, useState, useRef } from 'react'
import { Chatbot } from 'supersimpledev'
import type { MessageBox, ChatInputProps, ChatMessagesProps } from './types'
import './App.css'
import user from './assets/user.png'
import robot from './assets/robot.png'

function ChatInput({ chatMessages, setChatMessages }: ChatInputProps) {
  const [inputText, setInputText] = useState('')

  function saveTextInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value)
  }

  function sendMessage() {
    const newChatMessages: MessageBox[] = [
      ...chatMessages,
      {
        message: inputText,
        sender: 'user',
        id: crypto.randomUUID()
      }
    ]
    
    setChatMessages(newChatMessages)

    const response = Chatbot.getResponse(inputText)
    setChatMessages([
      ...newChatMessages,
      {
        message: response,
        sender: 'robot',
        id: crypto.randomUUID()
      }
    ])

    setInputText('')
  }

  return (
    <div className="chat-input-container">
      <input 
        className="chat-input"
        placeholder="Send a message to Chatbot"
        size={30}
        value={inputText} 
        onChange={saveTextInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage()
          }
        }}
        />
      <button 
        onClick={sendMessage}
        className="send-btn"
      >Send</button>
    </div>
  )
}

function ChatMessage({ message, sender }: MessageBox) {
  return (
    <div className={
        sender === 'user'
        ? 'chat-message-user' 
        : 'chat-message-robot'
      }>
      {sender === 'robot' && <img src={robot} className="chat-message-profile" />}
      <div className="chat-message-text">
        {message}
      </div>  
      {sender === 'user' && <img src={user} className="chat-message-profile" />}
    </div>
  )
}

function ChatMessages({ chatMessages }: ChatMessagesProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElem = chatMessagesRef.current
    if (containerElem) {
      containerElem.scrollTop = containerElem.scrollHeight
    }
  }, [chatMessages])
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
    </div>
  )
}

function App() {
  const [chatMessages, setChatMessages] = useState<MessageBox[]>([])

  return (
    <div className="app-container">
      {chatMessages.length === 0 && 
        <p className="welcome-message">Write messages bellow</p>
      }
      <ChatMessages 
        chatMessages={chatMessages}
      />
      <ChatInput 
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />
    </div>
  )
}

export default App