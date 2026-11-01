import { useState, useMemo } from 'react'
import useFavicon from './hooks/useFavicon'
import useElementHeight from './hooks/useElementHeight'
import useToast from './hooks/useToast'
import useDrafts from './hooks/useDrafts'
import useChatTitles from './hooks/useChatTitles'
import useChats from './hooks/useChats'

import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'

import { getRandomGreeting } from './utils/greetings'

import './App.css'
import './components/styles/shared.css'

function App() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const { draftText, setDraftText, clearDraft } = useDrafts(activeChatId)

  const {
    chats,
    setChats,
    typingChatIds,
    isBotTyping,
    sendMessage,
    cancelReply,
  } = useChats({
    activeChatId,
    setActiveChatId,
    onMessageSent: clearDraft,
  })

  const { chatsWithTitles } = useChatTitles(chats, setChats, typingChatIds)

  const { toast, showToast, hideToast } = useToast({
    hideWhen: !isBotTyping,
    resetOn: activeChatId
  })

  const [inputWrapperRef, inputHeight] = useElementHeight<HTMLDivElement>()
  useFavicon(typingChatIds.size > 0)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const currentMessages = activeChat?.messages ?? []
  const isEmpty = currentMessages.length === 0

  const greetings = useMemo(() => getRandomGreeting(), [activeChatId])

  function createNewChat() {
    setActiveChatId(null)
  }
  
  return (
    <div className="app-shell">
      <Sidebar 
        chats={chatsWithTitles}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={createNewChat}
      />
      <div 
        className={`app-container ${isEmpty ? 'empty-state' : ''}`}
        style={{ '--input-height': `${inputHeight}px` } as React.CSSProperties}
      >
        {toast && (
          <Toast 
            key={toast.id}
            message={toast.message}
            onDone={hideToast}
          />
        )}
        <ChatMessages 
          chatId={activeChatId}
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
              isBotTyping={isBotTyping}
              onSend={sendMessage}
              onCancel={cancelReply}
              onBlockedSend={() => showToast('Wait for the response to finish, or press Stop.')}
              inputText={draftText}
              setInputText={setDraftText}
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