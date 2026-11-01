import { useState, useMemo, useRef, useCallback } from 'react'
import useFavicon from './hooks/useFavicon'
import useElementHeight from './hooks/useElementHeight'
import useToast from './hooks/useToast'
import useDrafts from './hooks/useDrafts'
import useChatTitles from './hooks/useChatTitles'

import type { MessageBox, ChatSession } from './types'

import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'

import { getRandomGreeting } from './utils/greetings'
import { isAbortError, streamBotReply } from './utils/chatApi'

import './App.css'
import './components/styles/shared.css'

function App() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const [typingChatIds, setTypingChatIds] = useState<Set<string>>(new Set())
  const controllersRef = useRef<Map<string, AbortController>>(new Map())

  const isBotTyping = activeChatId !== null && typingChatIds.has(activeChatId)

  const [inputWrapperRef, inputHeight] = useElementHeight<HTMLDivElement>()
  useFavicon(typingChatIds.size > 0)
  const { toast, showToast, hideToast } = useToast({
    hideWhen: !isBotTyping,
    resetOn: activeChatId
  })
  const { draftText, setDraftText, clearDraft } = useDrafts(activeChatId)
  const { chatsWithTitles } = useChatTitles(chats, setChats, typingChatIds)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const currentMessages = activeChat?.messages ?? []
  const isEmpty = currentMessages.length === 0

  const greetings = useMemo(() => getRandomGreeting(), [activeChatId])

  function createNewChat() {
    setActiveChatId(null)
  }

  function setTyping(chatId: string, typing: boolean) {
    setTypingChatIds((prev) => {
      const next = new Set(prev)
      if (typing) next.add(chatId)
      else next.delete(chatId)
      return next
    })
  }

  function appendMessage(chatId: string, message: MessageBox) {
    setChats((prev) => 
      prev.map((c) => 
        c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
      )
    )
  }

  function markFailed(chatId: string, messageId: string) {
    setChats((prev) => 
      prev.map((c) => 
        c.id === chatId
          ? {
            ...c,
            messages: c.messages.map((m) => 
              m.id === messageId ? { ...m, isFailed: true } : m
            )
          }
          : c
      )
    )
  }

  function setMessageText(chatId: string, messageId: string, text: string) {
    setChats((prev) => 
      prev.map((c) => 
        c.id === chatId
          ? {
            ...c,
            messages: c.messages.map((m) => 
              m.id === messageId ? { ...m, message: text }: m
            )
          }
          : c
        )
      )
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (activeChatId && typingChatIds.has(activeChatId)) return

    const chatId = activeChatId ?? crypto.randomUUID()

    const userMessage: MessageBox = {
      message: trimmed,
      sender: 'user',
      id: crypto.randomUUID(),
    }

    if (activeChatId) {
      appendMessage(chatId, userMessage)
    } else {
      setChats((prev) => [
        { id: chatId, messages: [userMessage] },
        ...prev,
      ])
      setActiveChatId(chatId)
    }

    clearDraft()
    setTyping(chatId, true)

    const controller = new AbortController()
    controllersRef.current.set(chatId, controller)
 
    // Streaming state for this request; kept outside React to avoid a render per token
    const reply = { id: null as string | null, text: '', frame: null as number | null }

    // The bot message appears with the first visible text; later chunks are batched per frame
    function showReply() {
      if (!reply.text.trim()) return

      if (!reply.id) {
        reply.id = crypto.randomUUID()
        appendMessage(chatId, { message: reply.text, sender: 'bot', id: reply.id })
      } else if (reply.frame === null) {
        const replyId = reply.id
        reply.frame = requestAnimationFrame(() => {
          reply.frame = null
          setMessageText(chatId, replyId, reply.text)
        })
      }
    }

    try {
      await streamBotReply(trimmed, controller.signal, (fullText) => {
        reply.text = fullText
        showReply()
      })
    } catch (error) {
      // Nothing was received, so this prompt has no reply
      if (!reply.id) markFailed(chatId, userMessage.id)

      if (!isAbortError(error)) {
        console.error(error)
        appendMessage(chatId, {
          message: 'Error: Failed to get a response from the server.',
          sender: 'bot',
          id: crypto.randomUUID(),
          isError: true,
        })
      }
    } finally {
      // Make sure the last chunk isn't lost to a pending frame
      if (reply.frame !== null) cancelAnimationFrame(reply.frame)
      if (reply.id) setMessageText(chatId, reply.id, reply.text)

      if (controllersRef.current.get(chatId) === controller) {
        controllersRef.current.delete(chatId)
        setTyping(chatId, false)
      }
    }
  }

  const handleCancel = useCallback(() => {
    if (!activeChatId) return

    controllersRef.current.get(activeChatId)?.abort()
    controllersRef.current.delete(activeChatId)
    setTypingChatIds((prev) => {
      const next = new Set(prev)
      next.delete(activeChatId)
      return next
    })
  }, [activeChatId])
  
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
              onCancel={handleCancel}
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