import { useState, useMemo, useEffect, useRef } from 'react'
import { useFavicon } from './hooks/useFavicon'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Sidebar from './components/Sidebar'
import { getRandomGreeting } from './utils/greetings'
import { DEFAULT_TITLE, requestChatTitle } from './utils/chatTitle'
import type { MessageBox, ChatSession } from './types'
import './App.css'
import './components/styles/shared.css'

function App() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [inputHeight, setInputHeight] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const NEW_CHAT_KEY = 'new-chat'
  const [typingChatIds, setTypingChatIds] = useState<Set<string>>(new Set())
  const controllersRef = useRef<Map<string, AbortController>>(new Map())

  const isBotTyping = activeChatId !== null && typingChatIds.has(activeChatId)

  const inputWrapperRef = useRef<HTMLDivElement>(null)

  useFavicon(typingChatIds.size > 0)

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

  const greetings = useMemo(() => getRandomGreeting(), [activeChatId])

  const draftKey = activeChatId ?? NEW_CHAT_KEY
  const draftText = drafts[draftKey] ?? ''

  const [titles, setTitles] = useState<Record<string, string>>({})
  const titleRequestRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const chat of chats) {
      if (titleRequestRef.current.has(chat.id)) continue

      const firstUserMessage = chat.messages.find((m) => m.sender === 'user' && !m.isFailed)
      const hasBotReply = chat.messages.some((m) => m.sender === 'bot' && !m.isError)

      if (!firstUserMessage || !hasBotReply) continue

      titleRequestRef.current.add(chat.id)

      requestChatTitle(firstUserMessage.message).then((title) => {
        setTitles((prev) => ({ ...prev, [chat.id]: title }))
      })
    }
  }, [chats])

  const chatsWithTitles = chats.map((c) => ({
    ...c,
    title: titles[c.id] ?? DEFAULT_TITLE
  }))

  function setDraftText(text: string) {
    setDrafts((prev) => ({ ...prev, [draftKey]: text}))
  }

  function clearDraft(key: string) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

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
        { id: chatId, messages: [userMessage], title: DEFAULT_TITLE },
        ...prev,
      ])
      setActiveChatId(chatId)
    }

    clearDraft(draftKey)
    setTyping(chatId, true)

    const controller = new AbortController()
    controllersRef.current.set(chatId, controller)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error('Server error')
      }

      const data = await res.json()

      if (typeof data.reply !== 'string') throw new Error('Bad response')

      appendMessage(chatId, {
        message: data.reply,
        sender: 'bot',
        id: crypto.randomUUID(),
      })
    } catch (error) {
      markFailed(chatId, userMessage.id)

      if (error instanceof DOMException && error.name === 'AbortError') {
        // nothing
      } 
      else {
        console.error(error)
        appendMessage(chatId, {
          message: 'Error: Failed to get a response from the server.',
          sender: 'bot',
          id: crypto.randomUUID(),
          isError: true,
        })
      }
    } finally {

      if (controllersRef.current.get(chatId) === controller) {
        controllersRef.current.delete(chatId)
        setTyping(chatId, false)
      }
    }
  }

  function cancelRequest(chatId: string) {
    if (!activeChatId) return

    controllersRef.current.get(chatId)?.abort()
    controllersRef.current.delete(chatId)
    setTyping(chatId, false)
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
              onCancel={() => {
                if (activeChatId) cancelRequest(activeChatId)
              }}
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