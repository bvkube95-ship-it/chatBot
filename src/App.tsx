import { useEffect, useState, useRef } from 'react'
import { Chatbot } from 'supersimpledev'
import type { MessageBox, ChatInputProps, ChatMessagesProps } from './types'
import './App.css'
import user from './assets/user.png'
import bot from './assets/robot.png'
import loadingCircle from './assets/loading-spinner.gif'

function ChatInput({ chatMessages, setChatMessages, isBotTyping, setIsBotTyping }: ChatInputProps) {
  const [inputText, setInputText] = useState('')

  function saveTextInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value)
  }

  async function sendMessage() {
    if (isBotTyping) {
      return
    }

    const newChatMessages: MessageBox[] = [
      ...chatMessages,
      {
        message: inputText,
        sender: 'user',
        id: crypto.randomUUID()
      }
    ]

    setChatMessages(newChatMessages)
    setInputText('')
    setIsBotTyping(true)

    const response = await Chatbot.getResponseAsync(inputText)

    setChatMessages([
      ...newChatMessages,
      {
        message: response,
        sender: 'bot',
        id: crypto.randomUUID()
      }
    ])
    setIsBotTyping(false)
  }

  return (
    <div className="chat-input-container">
      <input 
        className="chat-input"
        placeholder="Send a message to Chatbot"
        size={30}
        value={inputText} 
        onChange={saveTextInput}
        disabled={isBotTyping}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage()
          }
        }}
        />
      <button 
        onClick={sendMessage}
        className="send-btn"
        disabled={isBotTyping}
      >Send</button>
    </div>
  )
}

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

function App() {
  const [chatMessages, setChatMessages] = useState<MessageBox[]>([])
  const [isBotTyping, setIsBotTyping] = useState(false)

  return (
    <div className="app-container">
      {chatMessages.length === 0 && (
          <p className="welcome-message">
            Welcome to the chatbot project! Send a message using the textbox below.
          </p>
        )}
      <ChatMessages 
        chatMessages={chatMessages}
        isBotTyping={isBotTyping}
      />
      <ChatInput 
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        isBotTyping={isBotTyping}
        setIsBotTyping={setIsBotTyping}
      />
    </div>
  )
}

export default App