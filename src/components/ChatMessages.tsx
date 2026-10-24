import { useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import ChatMessage from './ChatMessage'
import type { MessageBox } from '../types'
import './styles/ChatMessages.css'

interface ChatMessagesProps {
  chatId: string | null
  chatMessages: MessageBox[]
  isBotTyping: boolean
  inputHeight: number
}

const BOTTOM_THRESHOLD = 150
const PIN_TOP_OFFSET = 16

function ChatMessages({ chatId, chatMessages, isBotTyping, inputHeight }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
 
  const shouldAutoScrollRef = useRef(true)
  const scrollPositionRef = useRef<Record<string, number>>({})
  // Used to detect the scroll direction
  const lastScrollTopRef = useRef(0)
  // The scroll listener isn't re-subscribed when the chat changes, so it reads it from a ref
  const currentChatIdRef = useRef<string | null>(chatId)
  const lastChatIdRef = useRef<string | null>(chatId)
 
  const pinnedIdRef = useRef<string | null>(null)
  // Remembered per chat so the extra space is restored when returning to it
  const pinnedByChatRef = useRef<Record<string, string>>({})
  // Previous values, used to tell "user sent a message" from "bot replied" or "chat switched"
  const prevChatIdRef = useRef<string | null>(chatId)
  const prevLengthRef = useRef(chatMessages.length)

  const getPinnedElement = useCallback(() => {
    const id = pinnedIdRef.current
    if (!id) return null
    return innerRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`) ?? null
  }, [])

  const updateSpacer = useCallback(() => {
    const container = containerRef.current
    const inner = innerRef.current
    const spacer = spacerRef.current
    if (!container || !inner || !spacer) return
 
    const pinned = getPinnedElement()
    if (!pinned) return
 
    // The spacer's current height is subtracted, so the result doesn't depend 
    // on it and the space never stacks across prompts
    const spacerHeight = spacer.getBoundingClientRect().height
    const contentBelow =
      inner.getBoundingClientRect().bottom -
      pinned.getBoundingClientRect().top -
      spacerHeight
 
    const needed = container.clientHeight - PIN_TOP_OFFSET
    spacer.style.height = `${Math.max(0, needed - contentBelow)}px`
  }, [getPinnedElement])

  // The user scrolled up: take back exactly as much space as the view moved,
  // so the bottom edge follows the view and there is nothing to scroll down into.
  // The scroll position never exceeds the new maximum, so the content doesn't jump.
  const releaseSpace = useCallback(() => {
    const container = containerRef.current
    const spacer = spacerRef.current
    if (!container || !spacer) return
 
    const spacerHeight = spacer.getBoundingClientRect().height
    if (spacerHeight === 0) return
 
    const excess = container.scrollHeight - container.clientHeight - container.scrollTop
    if (excess < 1) return
 
    spacer.style.height = `${Math.max(0, spacerHeight - excess)}px`
 
    // Drop the pin so updateSpacer can't bring the space back
    pinnedIdRef.current = null
    const id = currentChatIdRef.current
    if (id) delete pinnedByChatRef.current[id]
  }, [])

  const scrollToPinned = useCallback((behavior: ScrollBehavior) => {
    const container = containerRef.current
    const pinned = getPinnedElement()
    if (!container || !pinned) return

    const delta =
      pinned.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      PIN_TOP_OFFSET
 
    container.scrollTo({ top: container.scrollTop + delta, behavior })
  }, [getPinnedElement])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
 
    const handleScroll = () => {
      const scrolledUp = container.scrollTop < lastScrollTopRef.current
      lastScrollTopRef.current = container.scrollTop
 
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight
 
      shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD
 
      const currentId = currentChatIdRef.current
      if (currentId) {
        scrollPositionRef.current[currentId] = container.scrollTop
      }
 
      // While the bot is generating, the space is needed for the reply
      if (scrolledUp && !isBotTyping) releaseSpace()
    }
 
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isBotTyping, releaseSpace])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => updateSpacer())
    observer.observe(container)
    return () => observer.disconnect()
  }, [updateSpacer])

  // chat switched
  useLayoutEffect(() => {
    const container = containerRef.current
    const spacer = spacerRef.current
    if (!container || !spacer) return

    currentChatIdRef.current = chatId

    // Clear the previous chat's space, then restore this chat's own (if it has one)
    spacer.style.height = '0px'
    pinnedIdRef.current = chatId ? pinnedByChatRef.current[chatId] ?? null : null
    updateSpacer()

    const saved = chatId ? scrollPositionRef.current[chatId] : undefined
    container.scrollTop = saved ?? container.scrollHeight
    // Programmatic jump: keep it from looking like a scroll up
    lastScrollTopRef.current = container.scrollTop

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight

    shouldAutoScrollRef.current = distanceFromBottom < BOTTOM_THRESHOLD
  }, [chatId, updateSpacer])

  // User sent a message: pin it to the top
  useLayoutEffect(() => {
    const prevChat = prevChatIdRef.current
    const prevLength = prevLengthRef.current
    // Updated before the early returns so they stay current on every render
    prevChatIdRef.current = chatId
    prevLengthRef.current = chatMessages.length

    const last = chatMessages[chatMessages.length - 1]
    if (!chatId || last?.sender !== 'user') return

    const isNewInSameChat = prevChat === chatId && chatMessages.length > prevLength
    // The chat is created in the same render as its first message.
    // isBotTyping keeps an old chat that ends with a user message from being pinned.
    const isFirstInNewChat =
      prevChat === null && chatMessages.length === 1 && isBotTyping

    if (!isNewInSameChat && !isFirstInNewChat) return

    pinnedIdRef.current = last.id
    pinnedByChatRef.current[chatId] = last.id
    updateSpacer()
    scrollToPinned('smooth')
  }, [chatMessages, chatId, isBotTyping, updateSpacer, scrollToPinned])

  useLayoutEffect(() => {
    updateSpacer()
  }, [chatMessages, isBotTyping, inputHeight, updateSpacer])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
 
    // The chat switch is handled by the layout effect above
    if (lastChatIdRef.current !== chatId) {
      lastChatIdRef.current = chatId
      return
    }
 
    // While a message is pinned, the view stays where it is
    if (pinnedIdRef.current) return
 
    if (shouldAutoScrollRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages, isBotTyping, inputHeight, chatId])

  return (
    <div className="chat-messages-container" ref={containerRef}>
      <div className="chat-messages-inner" ref={innerRef}>
        {chatMessages.map(({ message, sender, id }) => (
          <ChatMessage key={id} message={message} sender={sender} id={id} />
        ))}
        {isBotTyping && (
          <div className="chat-message-bot">
            <div className="chat-message-text-bot">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        {/* Height is set imperatively in updateSpacer and releaseSpace */}
        <div ref={spacerRef} aria-hidden="true" />
      </div>
    </div>
  )
}

export default ChatMessages