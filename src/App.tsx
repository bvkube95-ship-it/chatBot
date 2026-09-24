import { useState, useMemo } from 'react'
import { useFavicon } from './hooks/useFavicon'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Fireflies from './components/Fireflies'
import { getRandomGreeting } from './utils/greetings'
import type { MessageBox } from './utils/types'
import './App.css'

function App() {
  const [chatMessages, setChatMessages] = useState<MessageBox[]>([])
  const [isBotTyping, setIsBotTyping] = useState(false)
  const isEmpty = chatMessages.length === 0

  useFavicon(isBotTyping)

  const greetings = useMemo(() => getRandomGreeting(), [])

  return (
    <div className={`app-container ${isEmpty ? 'empty-state' : ''}`}>
      <ChatMessages 
        chatMessages={chatMessages}
        isBotTyping={isBotTyping}
      />
      <div className="chat-input-wrapper">
        {isEmpty && (
          <>
            <Fireflies />
            <p className="welcome-message">
              {greetings}
            </p>
          </>
        )}
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