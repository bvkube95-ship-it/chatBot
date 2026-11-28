import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatSession } from '../types'
import type { User } from "../utils/authApi"
import { IonIcon } from '@ionic/react'
import { chatbubbleOutline, personCircleOutline, logOutOutline } from 'ionicons/icons'
import sidebarIcon from "../assets/sidebar-icon.png"
import logoIcon from "../assets/logo-white.png"
import newChat from "../assets/new-chat.png"
import './styles/Sidebar.css'

interface SidebarProps {
  chats: ChatSession[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onNewChat: () => void
  user: User | null
  isAuthLoading: boolean
  onSignIn: () => void
  onLogout: () => void
}

const MIN_WIDTH = 200
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 260
const HIDE_DELAY = 200

function Sidebar({ 
  chats, activeChatId, onSelectChat, onNewChat,
  user, isAuthLoading, onSignIn, onLogout, }: SidebarProps) {

  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isPhantomVisible, setIsPhantomVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(DEFAULT_WIDTH)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* --------- ACCOUNT MENU --------- */

  // Close the account menu on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return

    function onMouseDown(e: MouseEvent) {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

  function handleAccountClick() {
    if (isAuthLoading) return
    if (!user) {
      onSignIn()
      return
    }
    setIsMenuOpen((prev) => !prev)
  }

  function handleLogout() {
    setIsMenuOpen(false)
    onLogout()
  }

  const avatarUrl = user?.avatarUrl ?? null
  const initial = (user?.name ?? user?.email ?? '').trim().charAt(0).toUpperCase()

  /* --------- RESIZING --------- */

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
    setWidth(widthRef.current)
  }, [])

  const slotRef = useRef<HTMLDivElement>(null)

  const resize = useCallback((e: MouseEvent) => {
    const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH)
    widthRef.current = newWidth

    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`
    }

    if (slotRef.current) {
      slotRef.current.style.width = `${newWidth}px`
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
    <div 
      className={`sidebar-slot ${isCollapsed ? 'collapsed' : ''}`} 
      ref={slotRef}
      style={isCollapsed ? undefined : { width: `${width}px` }}
    >
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
            aria-label={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
          >
            <img 
              src={sidebarIcon} 
              className="sidebar-icon sidebar-icon-panel" 
              alt="" 
              draggable={false} 
            />
            <img 
              src={logoIcon} 
              className="sidebar-icon sidebar-icon-logo" 
              alt="" 
              draggable={false} 
            />
          </button>
          <span className="sidebar-title">NYX Assist</span>
        </div>

          

        <div className="chat-list">
          <button 
            className="new-chat-btn" 
            onClick={onNewChat}
            data-tooltip={isRail ? 'New chat' : undefined}
          >
            <img src={newChat} className="new-chat-icon" />
            <span className="new-chat-label">New chat</span>
          </button>
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

        <div className="sidebar-footer" ref={footerRef}>
          {user && isMenuOpen && (
            <div className="account-menu" role="menu">
              <div className="account-menu-email">{user.email}</div>
              <button className="account-menu-item" role="menuitem" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} className="account-menu-icon" />
                Log out
              </button>
            </div>
          )}

          <button
            className="account-btn"
            onClick={handleAccountClick}
            aria-haspopup={user ? 'menu' : undefined}
            aria-expanded={user ? isMenuOpen : undefined}
            data-tooltip={isRail ? (user ? 'Account' : 'Sign in') : undefined}
          >
            {user ? (
              avatarUrl && failedAvatar !== avatarUrl ? (
                <img
                  className="account-avatar"
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setFailedAvatar(avatarUrl)}
                />
              ) : (
                <span className="account-avatar account-avatar-fallback">{initial}</span>
              )
            ) : (
              <IonIcon icon={personCircleOutline} className="account-icon" />
            )}
            <span className="account-label">
              {isAuthLoading ? '' : user ? (user.name ?? user.email) : 'Sign in'}
            </span>
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