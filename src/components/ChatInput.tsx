import { useState, useRef } from 'react'
import type { MessageBox, ChatInputProps } from '../types'
import { IonIcon } from '@ionic/react';
import { arrowUp, stopOutline } from 'ionicons/icons';
import './styles/ChatInput.css'

function ChatInput({ chatMessages, setChatMessages, isBotTyping, setIsBotTyping }: ChatInputProps) {
  const [inputText, setInputText] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  function saveTextInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value)
  }

  const controller = new AbortController()
  abortControllerRef.current = controller

  async function sendMessage() {
    if (isBotTyping) {
      return
    }

    const newChatMessages: MessageBox[] = [
      ...chatMessages,
      {
        message: inputText,
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
        body: JSON.stringify({ message: inputText }),
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
        setChatMessages([
          ...newChatMessages,
          {
            message: "Request cancelled",
            sender: "bot",
            id: crypto.randomUUID()
          }
        ])
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
        <input
          className="chat-input"
          placeholder="Write a message..."
          size={30}
          value={inputText} 
          onChange={saveTextInput}
          disabled={isBotTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage()
            }
          }}
      />
        <button 
          type="button"
          onClick={isBotTyping ? cancelRequest : sendMessage}
          className="send-btn"
        >
          {isBotTyping 
            ? <IonIcon icon={stopOutline} className='send-stop-btn' />
            : <IonIcon icon={arrowUp} className='send-stop-btn' />
          }
          
        </button>
      </div>
        <p className="ai-mistakes-message">AI can make mistakes</p>
    </>
  )
}

export default ChatInput