import { useState } from 'react'
import type { MessageBox, ChatInputProps } from '../types'
import './styles/ChatInput.css'

function ChatInput({ chatMessages, setChatMessages, isBotTyping, setIsBotTyping }: ChatInputProps) {
  const [inputText, setInputText] = useState('')

  function saveTextInput(event: React.ChangeEvent<HTMLInputElement>) {
    setInputText(event.target.value)
  }

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
      console.error(error)
      setChatMessages([
        ...newChatMessages,
        {
          message: 'Error: Unable to get response from the server.',
          sender: 'bot',
          id: crypto.randomUUID()
        }
      ])
    } finally {
      setIsBotTyping(false)
    }
  }

  return (
    <div className="chat-input-container">
      <input 
        className="chat-input"
        placeholder="Send a message to Chatbot"
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
        onClick={sendMessage}
        className="send-btn"
        disabled={isBotTyping}
      >Send</button>
    </div>
  )
}

export default ChatInput