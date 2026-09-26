import { useState, useEffect, useRef } from 'react'
import type { MessageBox, ChatInputProps } from '../utils/types'
import { IonIcon } from '@ionic/react';
import { paperPlaneOutline, stopOutline } from 'ionicons/icons';
import './styles/ChatInput.css'

function ChatInput({ chatMessages, setChatMessages, isBotTyping, setIsBotTyping }: ChatInputProps) {
  const [inputText, setInputText] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const isOverflowing = textarea.scrollHeight > 200
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
      textarea.style.overflowY = isOverflowing ? 'auto' : 'hidden'
      textarea.scrollTop = textarea.scrollHeight
    }
  }, [inputText])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isBotTyping) {
        cancelRequest()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return() => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isBotTyping])

  function saveTextInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(event.target.value)
  }

  async function sendMessage() {
    const trimmedInputText = inputText.trim()
    if (isBotTyping) {
      return
    }

    if (!trimmedInputText) {
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const newChatMessages: MessageBox[] = [
      ...chatMessages,
      {
        message: trimmedInputText,
        sender: 'user',
        id: crypto.randomUUID()
      }
    ]

    setChatMessages(newChatMessages)
    setInputText('')
    setIsBotTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInputText }),
        signal: controller.signal
      })

      if (!res.ok) {
        throw new Error(`Server error`)
      }

      const data = await res.json()

      setChatMessages([
        ...newChatMessages,
        {
          message: data.reply,
          sender: 'bot',
          id: crypto.randomUUID()
        }
      ])
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
       // nothing
      } else {
        console.error(error)
        setChatMessages([
          ...newChatMessages,
          {
            message: 'Error: Unable to get response from the server.',
            sender: 'bot',
            id: crypto.randomUUID()
          }
        ])
      }
    } finally {
      abortControllerRef.current = null
      setIsBotTyping(false)
    }
  }

  function cancelRequest() {
    abortControllerRef.current?.abort()
    setIsBotTyping(false)
  }

  return (
    <>
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Write a message..."
          value={inputText} 
          rows={1}
          onChange={saveTextInput}
          disabled={isBotTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
      />
        <button 
          type="button"
          onClick={isBotTyping ? cancelRequest : sendMessage}
          className="send-btn"
        >
          <span className="send-icon">
            <IonIcon 
              icon={isBotTyping ? stopOutline : paperPlaneOutline}
              className="send-icon-white"
            />

            <IonIcon 
              icon={isBotTyping ? stopOutline : paperPlaneOutline}
              className="send-icon-green"
            />
          </span>
        </button>
      </div>
    </>
  )
}

export default ChatInput