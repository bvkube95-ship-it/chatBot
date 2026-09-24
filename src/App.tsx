import { useState } from 'react'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Fireflies from './components/FireFlies'
import type { MessageBox } from './types'
import './App.css'

function App() {
  const [chatMessages, setChatMessages] = useState<MessageBox[]>([])
  const [isBotTyping, setIsBotTyping] = useState(false)
  const isEmpty = chatMessages.length === 0

  return (
    <div className={`app-container ${isEmpty ? 'empty-state' : ''}`}>
      {isEmpty && (
          <>
            <Fireflies />
            <p className="welcome-message">
              Hey there
            </p>
          </>
        )}
      <ChatMessages 
        chatMessages={chatMessages}
        isBotTyping={isBotTyping}
      />
      <div className="chat-input-wrapper">
        <ChatInput 
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            isBotTyping={isBotTyping}
            setIsBotTyping={setIsBotTyping}
        />
      </div>
          {!isEmpty && (
              <p className="ai-mistakes-message">AI can make mistakes</p>
          )}
    </div>
  )
}

export default App