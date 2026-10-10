import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatSession } from '../types'
import { IonIcon } from '@ionic/react'
import { chatbubbleOutline, personCircleOutline } from 'ionicons/icons'
import sidebarIcon from "../assets/sidebar-icon.png"
import newChat from "../assets/new-chat.png"
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
const HIDE_DELAY = 200

function Sidebar({ chats, activeChatId, onSelectChat, onNewChat }: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isPhantomVisible, setIsPhantomVisible] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(DEFAULT_WIDTH)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* --------- RESIZING --------- */

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

  /* --------- PHANTOM SIDEBAR --------- */

  function cancelHide() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  function showPhantom() {
    cancelHide()
    setIsPhantomVisible(true)
  }

  function scheduleHide() {
    cancelHide()
    hideTimeoutRef.current = setTimeout(() => {
      setIsPhantomVisible(false)
    }, HIDE_DELAY)
  }

  useEffect(() => {
    return () => cancelHide()
  }, [])

  /* --------- HANDLERS --------- */

  function toggleSidebar() {
    cancelHide()
    setIsPhantomVisible(false)
    setIsCollapsed((prev) => !prev)
  }

  /* --------- STATE FOR MARKING ---------*/

  const isRail = isCollapsed && !isPhantomVisible

  const SidebarClassName = [
    'sidebar',
    isCollapsed && 'collapsed',
    isCollapsed && isPhantomVisible && 'visible',
    isRail && 'rail',
  ].filter(Boolean).join(' ')

  return (
    <div className={`sidebar-slot ${isCollapsed ? 'collapsed' : ''}`} >
      <div
        className={SidebarClassName}
        ref={sidebarRef}
        style={isCollapsed ? { '--sidebar-width': `${width}px` } as React.CSSProperties : { width: `${width}px` }}
        onMouseEnter={isCollapsed ? cancelHide : undefined}
        onMouseLeave={isCollapsed ? scheduleHide : undefined}
      >
        <div className="sidebar-top-row">
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            onMouseEnter={isCollapsed ? showPhantom : undefined}
          >
            <img src={sidebarIcon} className="sidebar-icon" />
          </button>
          <span className="sidebar-title">NYX Assist</span>
        </div>

        <div className="sidebar-header">
          <button 
            className="new-chat-btn" 
            onClick={onNewChat}
            data-tooltip={isRail ? 'New chat' : undefined}
          >
            <img src={newChat} className="new-chat-icon" />
            <span className="new-chat-label">New chat</span>
          </button>
        </div>

        <div className="chat-list">
          <span className="chats-span">Chats and tasks</span>
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <IonIcon icon={chatbubbleOutline} className="chat-list-icon" />
              <span className="chat-item-title">{chat.title}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            className="account-btn"
            data-tooltip={isRail ? 'Account' : undefined}
          >
            <IonIcon icon={personCircleOutline} className="account-icon" />
            <span className="account-label">Account</span>
          </button>
        </div>

        {!isCollapsed && (
          <div
            className={`sidebar-resize-handle ${isResizing ? 'active' : ''}`}
            onMouseDown={startResizing}
          />
        )}
      </div>
    </div>
  )
}

export default Sidebar