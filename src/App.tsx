import { useState } from 'react'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import type { MessageBox } from './types'
import './App.css'

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