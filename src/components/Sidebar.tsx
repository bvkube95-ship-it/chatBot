import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatSession } from '../types'
import { IonIcon } from '@ionic/react'
import { addOutline, chatbubbleOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons'
import './styles/Sidebar.css'

interface SidebarProps {
  chats: ChatSession[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
}

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 260

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat }: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(DEFAULT_WIDTH)

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
    setWidth(widthRef.current)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH)
    widthRef.current = newWidth

    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`
    }
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.body.classList.add('sidebar-resizing')
    } else {
      document.body.classList.remove('sidebar-resizing')
    }

    if (!isResizing) return

    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  if (isCollapsed) {
    return (
      <button className="sidebar-expand-btn" onClick={() => setIsCollapsed(false)}>
        <IonIcon icon={chevronForwardOutline} />
      </button>
    )
  }

  return (
    <div className="sidebar" ref={sidebarRef} style={{ width: `${width}px` }}>
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewChat}>
          <IonIcon icon={addOutline} className="new-chat-icon" />
          New chat
        </button>
        <button className="sidebar-collapse-btn" onClick={() => setIsCollapsed(true)}>
          <IonIcon icon={chevronBackOutline} />
        </button>
      </div>

      <div className="chat-list">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <IonIcon icon={chatbubbleOutline} className="chat-list-icon" />
            <span className="chat-list-title">{chat.title}</span>
          </button>
        ))}
      </div>

      <div
        className={`sidebar-resize-handle ${isResizing ? 'active' : ''}`}
        onMouseDown={startResizing}
      />
    </div>
  )
}

export default Sidebar