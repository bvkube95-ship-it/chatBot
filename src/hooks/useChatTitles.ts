import { useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ChatSession } from '../types'
import { getDisplayTitle, getTitleSource, requestChatTitle } from '../utils/chatTitle'

// Fetches chat headers and returns a list of chats with prepared titles for the sidebar
function useChatTitles(
  chats: ChatSession[],
  setChats: Dispatch<SetStateAction<ChatSession[]>>,
  typingChatIds: Set<string>
) {
  // Chats for which the header has already been requested, to avoid sending the request again
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

    return { chatsWithTitles }
}

export default useChatTitles