import { useState, useEffect, useRef } from 'react'
import { IonIcon } from '@ionic/react';
import { paperPlaneOutline, stopOutline } from 'ionicons/icons';
import './styles/ChatInput.css'

interface ChatInputProps {
  isBotTyping: boolean
  onSend: (text: string) => void
  onCancel: () => void
  inputText: string
  setInputText: (text: string) => void
}

function ChatInput({ 
  isBotTyping,
  onSend,
  onCancel,
  inputText,
  setInputText,
}: ChatInputProps) {

  const [isMultiLine, setIsMultiLine] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

 useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'

    const style = getComputedStyle(textarea)
    const borderTop = parseFloat(style.borderTopWidth)
    const borderBottom = parseFloat(style.borderBottomWidth)
    const contentHeight = textarea.scrollHeight + borderTop + borderBottom

    const maxHeight = 200
    const newHeight = Math.min(contentHeight, maxHeight)

    textarea.style.height = `${newHeight}px`
    textarea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden'

    const lineHeight = parseFloat(style.lineHeight)
    const isTextMultiLine = textarea.scrollHeight > lineHeight + 24
    setIsMultiLine(isTextMultiLine)
  }, [inputText])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isBotTyping) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return() => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isBotTyping, onCancel])

  function saveTextInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(event.target.value)
  }

  function sendMessage() {
    if (isBotTyping ) return
    if (!inputText.trim()) return

    onSend(inputText)
  }

  return (
    <>
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className={`chat-input ${isMultiLine ? 'multiline' : ''}`}
          placeholder={isBotTyping ? "Waiting for a response..." : "Write a message..."}
          value={inputText} 
          rows={1}
          onChange={saveTextInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
      />
        <button 
          type="button"
          onClick={isBotTyping ? onCancel : sendMessage}
          className="send-btn"
          data-tooltip={isBotTyping ? "Stop" : "Send"}
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