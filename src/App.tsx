import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useFavicon } from './hooks/useFavicon'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import { getRandomGreeting } from './utils/greetings'
import { getDisplayTitle, getTitleSource, requestChatTitle } from './utils/chatTitle'
import type { MessageBox, ChatSession } from './types'
import './App.css'
import './components/styles/shared.css'

function App() {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [inputHeight, setInputHeight] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)

  const showToast = useCallback((message: string) => {
    setToast((prev) => prev ?? { id: Date.now(), message })
  }, [])

  const NEW_CHAT_KEY = 'new-chat'
  const [typingChatIds, setTypingChatIds] = useState<Set<string>>(new Set())
  const controllersRef = useRef<Map<string, AbortController>>(new Map())

  const isBotTyping = activeChatId !== null && typingChatIds.has(activeChatId)

  const inputWrapperRef = useRef<HTMLDivElement>(null)

  useFavicon(typingChatIds.size > 0)

  useEffect(() => {
    if (!isBotTyping) setToast(null)
  }, [isBotTyping])

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

  const titleRequestRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const chat of chats) {
      if (chat.title || titleRequestRef.current.has(chat.id)) continue
      // Wait for the stream to finish so the title request doesn't compete with it
      if (typingChatIds.has(chat.id)) continue

      const source = getTitleSource(chat)
      const hasBotReply = chat.messages.some((m) => m.sender === 'bot' && !m.isError)
      if (!source || !hasBotReply) continue 

      titleRequestRef.current.add(chat.id)

      requestChatTitle(source.message).then((title) => {
        setChats((prev) => 
          prev.map((c) => (c.id === chat.id ? { ...c, title } : c))
        )
      })
    }
  }, [chats])

  const chatsWithTitles = chats.map((c) => ({ ...c, title: getDisplayTitle(c) }))

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

    clearDraft(draftKey)
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error('Server error')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // stream: true keeps multi-byte characters split across chunks intact
        reply.text += decoder.decode(value, { stream: true })
        showReply()
      }

      reply.text += decoder.decode()
      showReply()

      if (!reply.text.trim()) throw new Error('Empty response')
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError'

      // Nothing was received, so this prompt has no reply
      if (!reply.id) markFailed(chatId, userMessage.id)

      if (!aborted) {
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
            onDone={() => setToast(null)}
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