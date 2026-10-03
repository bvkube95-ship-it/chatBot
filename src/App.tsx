import { useState, useMemo, useEffect, useRef } from 'react'
import { useFavicon } from './hooks/useFavicon'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Sidebar from './components/Sidebar'
import { getRandomGreeting } from './utils/greetings'
import type { MessageBox, ChatSession } from './types'
import './App.css'

function App() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [inputHeight, setInputHeight] = useState(0)

  const inputWrapperRef = useRef<HTMLDivElement>(null)

  useFavicon(isBotTyping)

  useEffect(() => {
    const el = inputWrapperRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setInputHeight(entry.contentRect.height)
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const activeChat = chats.find((c) => c.id === activeChatId)
  const currentMessages = activeChat?.messages ?? []
  const isEmpty = currentMessages.length === 0

  const greetings = useMemo(() => getRandomGreeting(), [])

  function createNewChat() {
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      title: "new chat",
      messages: [],
    }
    setChats([newChat, ...chats])
    setActiveChatId(newChat.id)
  }

  function updateMessages(messages: MessageBox[]) {
    if (activeChat) {
      setChats(chats.map((c) => 
        c.id === activeChatId ? {...c, messages} : c
      ))
    } else {
      const newChat: ChatSession = {
        id: crypto.randomUUID(),
        title: "new chat",
        messages,
      }
      setChats([newChat, ...chats])
      setActiveChatId(newChat.id)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar 
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={createNewChat}
      />
      <div 
        className={`app-container ${isEmpty ? 'empty-state' : ''}`}
        style={{ '--input-height': `${inputHeight}px` } as React.CSSProperties}
      >
        <ChatMessages 
          chatMessages={currentMessages}
          isBotTyping={isBotTyping}
          inputHeight={inputHeight}
        />
        <div className="chat-input-wrapper" ref={inputWrapperRef}>
          {isEmpty && (
              <p className="welcome-message">
                {greetings}
              </p>
          )}
          <ChatInput 
              chatMessages={currentMessages}
              setChatMessages={updateMessages}
              isBotTyping={isBotTyping}
              setIsBotTyping={setIsBotTyping}
          />
          {!isEmpty && (
              <p className="ai-mistakes-message">AI can make mistakes</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App