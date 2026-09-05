import { useState } from 'react'
import type { MessageBox, ChatInputProps } from '../types'
import { Chatbot } from 'supersimpledev'
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

    const response = await Chatbot.getResponseAsync(inputText)

    setChatMessages([
      ...newChatMessages,
      {
        message: response,
        sender: 'bot',
        id: crypto.randomUUID()
      }
    ])
    setIsBotTyping(false)
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